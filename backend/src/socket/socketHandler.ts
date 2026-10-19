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

        await socket.join(roomId);
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
        socket.data.peerInfo = peerInfo;
        socket.data.roomId = roomId;

        // Adapter-backed room enumeration includes sockets on other instances.
        const roomSockets = await io.in(roomId).fetchSockets();
        const existingParticipants = roomSockets
          .filter((peerSocket) => peerSocket.id !== socket.id && peerSocket.data.peerInfo)
          .map((peerSocket) => peerSocket.data.peerInfo as PeerInfo);
        socket.emit('existing-participants', existingParticipants);

        // Broadcast to all other participants that a new peer joined
        socket.to(roomId).emit('user-joined', peerInfo);

        console.log(`[Socket] ${peerInfo.name} (${socket.id}) joined room: ${roomId}. Total: ${roomSockets.length}`);
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
      if (socket.data.roomId === data.roomId && socket.data.peerInfo) {
        (socket.data.peerInfo as PeerInfo).isMuted = data.isMuted;
      }
      socket.to(data.roomId).emit('user-toggle-audio', {
        socketId: socket.id,
        isMuted: data.isMuted,
      });
    });

    socket.on('toggle-video', (data: { roomId: string; isVideoOff: boolean }) => {
      if (socket.data.roomId === data.roomId && socket.data.peerInfo) {
        (socket.data.peerInfo as PeerInfo).isVideoOff = data.isVideoOff;
      }
      socket.to(data.roomId).emit('user-toggle-video', {
        socketId: socket.id,
        isVideoOff: data.isVideoOff,
      });
    });

    socket.on('toggle-screenshare', (data: { roomId: string; isSharing: boolean }) => {
      if (socket.data.roomId === data.roomId && socket.data.peerInfo) {
        (socket.data.peerInfo as PeerInfo).isSharingScreen = data.isSharing;
      }
      socket.to(data.roomId).emit('user-toggle-screenshare', {
        socketId: socket.id,
        isSharing: data.isSharing,
      });
    });

    socket.on('raise-hand', (data: { roomId: string; isHandRaised: boolean }) => {
      let peerName = 'Participant';
      if (socket.data.roomId === data.roomId && socket.data.peerInfo) {
        const peer = socket.data.peerInfo as PeerInfo;
        peer.isHandRaised = data.isHandRaised;
        peerName = peer.name;
      }
      io.to(data.roomId).emit('user-raise-hand', {
        socketId: socket.id,
        isHandRaised: data.isHandRaised,
        userName: peerName,
      });
    });

    // In-meeting Real-time Reactions
    const handleMeetingReaction = async (data: {
      id?: string;
      roomId?: string;
      participantId?: string;
      socketId?: string;
      userId?: string;
      reaction?: string;
      emoji?: string;
      senderName?: string;
    }) => {
      const reaction = data?.reaction || data?.emoji || (typeof data === 'string' ? data : '');
      const targetRoom = (typeof data === 'object' && data?.roomId?.toString().trim())
        ? data.roomId.toString().trim()
        : socket.data.roomId;
      if (!targetRoom || !reaction) return;

      const participantId =
        (typeof data === 'object' && data?.participantId && data.participantId !== 'local')
          ? data.participantId
          : socket.id;

      const senderName =
        (typeof data === 'object' && data?.senderName?.trim()) ||
        (socket.data.peerInfo as PeerInfo)?.name ||
        'Participant';

      const payload = {
        id: data?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        roomId: targetRoom,
        participantId: socket.id || participantId,
        reaction,
        emoji: reaction,
        senderName,
        socketId: socket.id,
        userId: data?.userId || (socket.data.peerInfo as PeerInfo)?.userId,
        timestamp: Date.now(),
      };

      // Ensure socket is in targetRoom so socket membership is always guaranteed
      if (!socket.rooms.has(targetRoom)) {
        await socket.join(targetRoom);
      }

      // Broadcast to everyone ELSE in the same room (room-scoped, no sender echo)
      socket.to(targetRoom).emit('reaction', payload);
      socket.to(targetRoom).emit('meeting:reaction', payload);

      // If socket joined under a different roomId alias, broadcast to it as well
      if (socket.data.roomId && socket.data.roomId !== targetRoom) {
        socket.to(socket.data.roomId).emit('reaction', payload);
        socket.to(socket.data.roomId).emit('meeting:reaction', payload);
      }
    };

    socket.on('reaction', handleMeetingReaction);
    socket.on('meeting:reaction', handleMeetingReaction);
    socket.on('send-reaction', handleMeetingReaction);

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
          handleUserDisconnect(socket, roomId, io, false);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
};

function handleUserDisconnect(
  socket: Socket,
  roomId: string,
  io: SocketIOServer,
  leaveRoom = true
): void {
  const peer = socket.data.peerInfo as PeerInfo | undefined;
  if (!peer || socket.data.roomId !== roomId) return;

  io.to(roomId).emit('user-left', {
    socketId: socket.id,
    userName: peer.name,
  });

  delete socket.data.peerInfo;
  delete socket.data.roomId;
  if (leaveRoom) socket.leave(roomId);

  console.log(`[Socket] ${peer.name} (${socket.id}) left room: ${roomId}`);
}
