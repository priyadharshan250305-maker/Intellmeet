import { Server as SocketIOServer, Socket } from 'socket.io';
import { ChatMessage } from '../models/ChatMessage';
import { MeetingParticipant } from '../models/MeetingParticipant';
import { Meeting } from '../models/Meeting';

interface PeerInfo {
  socketId: string;
  userId?: string;
  name: string;
  avatar?: string;
  role: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isSharingScreen: boolean;
  isHandRaised: boolean;
  joinedAt: Date;
}

// In-memory room tracking for real-time presence: roomId -> Map<socketId, PeerInfo>
const rooms = new Map<string, Map<string, PeerInfo>>();

export const setupSocketHandlers = (io: SocketIOServer): void => {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join room
    socket.on('join-room', async (data: {
      roomId: string;
      user: { id?: string; name: string; avatar?: string; role?: string };
      isMuted?: boolean;
      isVideoOff?: boolean;
    }) => {
      try {
        const { roomId, user, isMuted = false, isVideoOff = false } = data;
        if (!roomId) return;

        socket.join(roomId);

        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Map());
        }

        const roomPeers = rooms.get(roomId)!;
        const peerInfo: PeerInfo = {
          socketId: socket.id,
          userId: user?.id,
          name: user?.name || 'Guest User',
          avatar: user?.avatar || '',
          role: user?.role || 'participant',
          isMuted,
          isVideoOff,
          isSharingScreen: false,
          isHandRaised: false,
          joinedAt: new Date(),
        };

        // Send existing participants in the room to the joining client
        const existingParticipants = Array.from(roomPeers.values());
        socket.emit('existing-participants', existingParticipants);

        // Add current peer to the room
        roomPeers.set(socket.id, peerInfo);

        // Broadcast to all other participants that a new peer joined
        socket.to(roomId).emit('user-joined', peerInfo);

        console.log(`[Socket] ${peerInfo.name} (${socket.id}) joined room: ${roomId}. Total: ${roomPeers.size}`);
      } catch (err: any) {
        console.error('[Socket] join-room error:', err);
      }
    });

    // WebRTC Signaling: Offer
    socket.on('signal-offer', (data: { targetSocketId: string; offer: any }) => {
      io.to(data.targetSocketId).emit('signal-offer', {
        senderSocketId: socket.id,
        offer: data.offer,
      });
    });

    // WebRTC Signaling: Answer
    socket.on('signal-answer', (data: { targetSocketId: string; answer: any }) => {
      io.to(data.targetSocketId).emit('signal-answer', {
        senderSocketId: socket.id,
        answer: data.answer,
      });
    });

    // WebRTC Signaling: ICE Candidate
    socket.on('signal-ice-candidate', (data: { targetSocketId: string; candidate: any }) => {
      io.to(data.targetSocketId).emit('signal-ice-candidate', {
        senderSocketId: socket.id,
        candidate: data.candidate,
      });
    });

    // Media toggle handlers
    socket.on('toggle-audio', (data: { roomId: string; isMuted: boolean }) => {
      const roomPeers = rooms.get(data.roomId);
      if (roomPeers && roomPeers.has(socket.id)) {
        roomPeers.get(socket.id)!.isMuted = data.isMuted;
      }
      socket.to(data.roomId).emit('user-toggle-audio', {
        socketId: socket.id,
        isMuted: data.isMuted,
      });
    });

    socket.on('toggle-video', (data: { roomId: string; isVideoOff: boolean }) => {
      const roomPeers = rooms.get(data.roomId);
      if (roomPeers && roomPeers.has(socket.id)) {
        roomPeers.get(socket.id)!.isVideoOff = data.isVideoOff;
      }
      socket.to(data.roomId).emit('user-toggle-video', {
        socketId: socket.id,
        isVideoOff: data.isVideoOff,
      });
    });

    socket.on('toggle-screenshare', (data: { roomId: string; isSharing: boolean }) => {
      const roomPeers = rooms.get(data.roomId);
      if (roomPeers && roomPeers.has(socket.id)) {
        roomPeers.get(socket.id)!.isSharingScreen = data.isSharing;
      }
      socket.to(data.roomId).emit('user-toggle-screenshare', {
        socketId: socket.id,
        isSharing: data.isSharing,
      });
    });

    socket.on('raise-hand', (data: { roomId: string; isHandRaised: boolean }) => {
      const roomPeers = rooms.get(data.roomId);
      let peerName = 'Participant';
      if (roomPeers && roomPeers.has(socket.id)) {
        const peer = roomPeers.get(socket.id)!;
        peer.isHandRaised = data.isHandRaised;
        peerName = peer.name;
      }
      io.to(data.roomId).emit('user-raise-hand', {
        socketId: socket.id,
        isHandRaised: data.isHandRaised,
        userName: peerName,
      });
    });

    // In-meeting Chat
    socket.on('send-message', async (data: {
      roomId: string;
      message: string;
      senderName: string;
      senderAvatar?: string;
      senderId?: string;
    }) => {
      try {
        const { roomId, message, senderName, senderAvatar, senderId } = data;
        if (!roomId || !message || message.trim().length === 0) return;

        const cleanMessage = message.trim().slice(0, 2000);
        const timestamp = new Date();

        // Persist to MongoDB if meeting is found
        try {
          const meeting = await Meeting.findOne({ roomId });
          if (meeting) {
            await ChatMessage.create({
              meetingId: meeting._id,
              senderId: senderId || undefined,
              senderName: senderName || 'Guest',
              senderAvatar: senderAvatar || '',
              message: cleanMessage,
              timestamp,
              isSystem: false,
            });
          }
        } catch (dbErr) {
          console.warn('[Socket] Chat persistence warning:', dbErr);
        }

        // Broadcast to all participants in the room
        io.to(roomId).emit('new-message', {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          roomId,
          message: cleanMessage,
          senderName: senderName || 'Guest',
          senderAvatar: senderAvatar || '',
          senderId,
          timestamp: timestamp.toISOString(),
          isSystem: false,
        });
      } catch (err: any) {
        console.error('[Socket] send-message error:', err);
      }
    });

    // Real-time live transcript segment broadcast
    socket.on('broadcast-transcript-segment', (data: {
      roomId: string;
      speakerName: string;
      text: string;
      startTime: number;
      endTime: number;
      source: string;
    }) => {
      io.to(data.roomId).emit('transcript-segment-received', {
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    // Explicit leave
    socket.on('leave-room', (data: { roomId: string }) => {
      handleUserDisconnect(socket, data.roomId, io);
    });

    // Disconnect
    socket.on('disconnecting', () => {
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id) {
          handleUserDisconnect(socket, roomId, io);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
};

function handleUserDisconnect(socket: Socket, roomId: string, io: SocketIOServer): void {
  const roomPeers = rooms.get(roomId);
  if (roomPeers && roomPeers.has(socket.id)) {
    const peer = roomPeers.get(socket.id)!;
    roomPeers.delete(socket.id);

    if (roomPeers.size === 0) {
      rooms.delete(roomId);
    }

    io.to(roomId).emit('user-left', {
      socketId: socket.id,
      userName: peer.name,
    });

    console.log(`[Socket] ${peer.name} (${socket.id}) left room: ${roomId}`);
  }
}
