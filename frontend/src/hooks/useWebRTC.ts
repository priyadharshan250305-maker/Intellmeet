import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { PeerState } from '../types';
import { meetingService } from '../services';

interface UseWebRTCOptions {
  socket: Socket | null;
  roomId: string;
  user: { id?: string; name: string; avatar?: string; role?: string };
  initialMuted?: boolean;
  initialVideoOff?: boolean;
}

export const useWebRTC = ({
  socket,
  roomId,
  user,
  initialMuted = false,
  initialVideoOff = false,
}: UseWebRTCOptions) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, PeerState>>(new Map());
  const [isAudioMuted, setIsAudioMuted] = useState(initialMuted);
  const [isVideoOff, setIsVideoOff] = useState(initialVideoOff);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // References
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const pendingIceCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const iceServersRef = useRef<RTCIceServer[]>([
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]);

  // Fetch STUN/TURN configuration
  useEffect(() => {
    meetingService
      .getIceServers()
      .then((res) => {
        if (res.data?.iceServers?.length) {
          iceServersRef.current = res.data.iceServers;
        }
      })
      .catch((err) => {
        console.warn('[WebRTC] Using default STUN servers:', err.message);
      });
  }, []);

  // Initialize local media stream (camera & mic)
  const initializeMedia = useCallback(async () => {
    try {
      setConnectionError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      console.info('[WebRTC] getUserMedia succeeded:', {
        streamId: stream.id,
        audioTrackCount: stream.getAudioTracks().length,
        videoTrackCount: stream.getVideoTracks().length,
      });

      // Apply initial mute / video off settings
      if (stream.getAudioTracks().length === 0) {
        console.error('[WebRTC] getUserMedia succeeded without a microphone audio track.');
      }
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !initialMuted;
        console.info('[WebRTC] Local microphone audio track:', {
          exists: true,
          id: track.id,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          settings: track.getSettings(),
        });
      });
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !initialVideoOff;
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err: any) {
      console.warn('[WebRTC] Media device access warning:', err.name, err.message);
      // Fallback: create an empty or audio-only canvas stream if camera/mic is denied or not connected
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.info('[WebRTC] Audio-only getUserMedia succeeded:', {
          streamId: audioOnlyStream.id,
          audioTrackCount: audioOnlyStream.getAudioTracks().length,
        });
        if (audioOnlyStream.getAudioTracks().length === 0) {
          console.error('[WebRTC] Audio-only getUserMedia returned no microphone track.');
        }
        audioOnlyStream.getAudioTracks().forEach((track) => {
          track.enabled = !initialMuted;
          console.info('[WebRTC] Local microphone audio track:', {
            exists: true,
            id: track.id,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            settings: track.getSettings(),
          });
        });
        localStreamRef.current = audioOnlyStream;
        setLocalStream(audioOnlyStream);
        setIsVideoOff(true);
        return audioOnlyStream;
      } catch (audioErr) {
        console.error('[WebRTC] Audio-only getUserMedia failed; no microphone stream available:', audioErr);
        setConnectionError('Microphone access failed. Check browser permissions and input devices.');
        return null;
      }
    }
  }, [initialMuted, initialVideoOff]);

  // Create RTCPeerConnection for a remote peer
  const createPeerConnection = useCallback(
    (targetSocketId: string, peerInfo: Partial<PeerState>) => {
      if (!socket) return null;

      const pc = new RTCPeerConnection({
        iceServers: iceServersRef.current,
      });
      console.info(`[WebRTC] Created peer connection for ${peerInfo.name || targetSocketId}:`, {
        socketId: targetSocketId,
        iceServerCount: iceServersRef.current.length,
        signalingState: pc.signalingState,
      });

      // Add local media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
          console.info(`[WebRTC] Added local ${track.kind} track to peer connection ${targetSocketId}:`, {
            id: track.id,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
          });
        });
        if (localStreamRef.current.getAudioTracks().length === 0) {
          console.error(`[WebRTC] No local audio track available to add for peer ${targetSocketId}.`);
        }
      } else {
        console.error(`[WebRTC] Cannot add local tracks for ${targetSocketId}: local stream is missing.`);
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.info(`[WebRTC] Sending ICE candidate to ${targetSocketId}:`, event.candidate.candidate);
          socket.emit('signal-ice-candidate', {
            targetSocketId,
            candidate: event.candidate,
          });
        }
      };

      // Handle remote incoming tracks
      pc.ontrack = (event) => {
        console.info(`[WebRTC] Received remote ${event.track.kind} track from ${targetSocketId}:`, {
          id: event.track.id,
          enabled: event.track.enabled,
          muted: event.track.muted,
          readyState: event.track.readyState,
          streams: event.streams.length,
        });
        const remoteStream = event.streams[0] || new MediaStream([event.track]);
        console.info(`[WebRTC] Remote stream from ${targetSocketId}:`, {
          id: remoteStream.id,
          audioTrackCount: remoteStream.getAudioTracks().length,
          audioTracks: remoteStream.getAudioTracks().map((track) => ({
            id: track.id,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
          })),
          videoTrackCount: remoteStream.getVideoTracks().length,
        });

        setPeers((prev) => {
          const next = new Map(prev);
          const existing = next.get(targetSocketId) || {
            socketId: targetSocketId,
            name: peerInfo.name || 'Participant',
            avatar: peerInfo.avatar || '',
            role: peerInfo.role || 'participant',
            isMuted: peerInfo.isMuted || false,
            isVideoOff: peerInfo.isVideoOff || false,
            isSharingScreen: peerInfo.isSharingScreen || false,
            isHandRaised: peerInfo.isHandRaised || false,
          };
          next.set(targetSocketId, {
            ...existing,
            stream: remoteStream,
          });
          return next;
        });
      };

      pc.onconnectionstatechange = () => {
        console.info(`[WebRTC] Connection state with ${targetSocketId}:`, pc.connectionState);
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          // Attempt ICE restart or mark peer reconnecting
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.info(`[WebRTC] ICE connection state with ${targetSocketId}:`, pc.iceConnectionState);
      };

      pc.onsignalingstatechange = () => {
        console.info(`[WebRTC] Signaling state with ${targetSocketId}:`, pc.signalingState);
      };

      peerConnections.current.set(targetSocketId, pc);
      return pc;
    },
    [socket]
  );

  // Set up signaling listeners and join room
  useEffect(() => {
    if (!socket || !roomId) return;

    let active = true;
    let mediaReady = false;
    let hasJoinedRoom = false;
    let hasConnectedBefore = socket.connected;

    const joinSocketRoom = () => {
      if (!active || !mediaReady || !socket.connected || hasJoinedRoom) return;

      hasJoinedRoom = true;
      console.info('[WebRTC] Joining Socket.IO room:', {
        roomId,
        socketId: socket.id,
        connected: socket.connected,
        localAudioTrackCount: localStreamRef.current?.getAudioTracks().length || 0,
        localAudioTracks: localStreamRef.current?.getAudioTracks().map((track) => ({
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
        })) || [],
      });
      socket.emit('join-room', {
        roomId,
        user,
        isMuted: initialMuted,
        isVideoOff: initialVideoOff,
      });
    };

    const handleSocketConnect = () => {
      console.info('[WebRTC] Socket connected for room:', roomId, socket.id);
      if (hasConnectedBefore) {
        console.info('[WebRTC] Socket reconnected; clearing stale peer connections and rejoining room:', roomId);
        peerConnections.current.forEach((pc) => pc.close());
        peerConnections.current.clear();
        pendingIceCandidates.current.clear();
        setPeers(new Map());
        hasJoinedRoom = false;
      }
      hasConnectedBefore = true;
      joinSocketRoom();
    };

    const handleSocketDisconnect = (reason: string) => {
      console.warn('[WebRTC] Socket disconnected from room:', roomId, reason);
      hasJoinedRoom = false;
    };

    socket.on('connect', handleSocketConnect);
    socket.on('disconnect', handleSocketDisconnect);

    initializeMedia().then((mediaStream) => {
      if (!active) return;
      mediaReady = true;
      joinSocketRoom();
    });

    // Received existing participants from server
    const handleExistingParticipants = (existing: PeerState[]) => {
      console.log('[WebRTC] Received existing participants:', existing);
      setPeers((prev) => {
        const next = new Map(prev);
        existing.forEach((p) => {
          if (p.socketId !== socket.id) {
            next.set(p.socketId, p);
          }
        });
        return next;
      });
    };

    const flushPendingIceCandidates = async (
      senderSocketId: string,
      pc: RTCPeerConnection
    ) => {
      const candidates = pendingIceCandidates.current.get(senderSocketId) || [];
      pendingIceCandidates.current.delete(senderSocketId);

      for (const candidate of candidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.debug(`[WebRTC] Added queued ICE candidate from ${senderSocketId}`);
        } catch (err) {
          console.error(`[WebRTC] Error adding queued ICE candidate from ${senderSocketId}:`, err);
        }
      }
    };

    // A new user joined the room -> existing peers initiate the WebRTC offer
    const handleUserJoined = async (peerInfo: PeerState) => {
      console.log('[WebRTC] User joined room:', peerInfo);
      setPeers((prev) => {
        const next = new Map(prev);
        next.set(peerInfo.socketId, peerInfo);
        return next;
      });

      const pc = createPeerConnection(peerInfo.socketId, peerInfo);
      if (pc) {
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pc.setLocalDescription(offer);
          console.info(`[WebRTC] Sending offer to ${peerInfo.socketId}; signaling state:`, pc.signalingState);
          socket.emit('signal-offer', {
            targetSocketId: peerInfo.socketId,
            offer,
          });
        } catch (err: any) {
          console.error('[WebRTC] Error creating offer:', err);
        }
      }
    };

    // Receive WebRTC Offer
    const handleSignalOffer = async (data: { senderSocketId: string; offer: RTCSessionDescriptionInit }) => {
      console.info('[WebRTC] Received offer from:', data.senderSocketId);
      let pc = peerConnections.current.get(data.senderSocketId);
      if (!pc) {
        pc = createPeerConnection(data.senderSocketId, {})!;
      }

      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          await flushPendingIceCandidates(data.senderSocketId, pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.info(`[WebRTC] Sending answer to ${data.senderSocketId}; signaling state:`, pc.signalingState);
          socket.emit('signal-answer', {
            targetSocketId: data.senderSocketId,
            answer,
          });
        } catch (err: any) {
          console.error('[WebRTC] Error responding to offer:', err);
        }
      }
    };

    // Receive WebRTC Answer
    const handleSignalAnswer = async (data: { senderSocketId: string; answer: RTCSessionDescriptionInit }) => {
      console.info('[WebRTC] Received answer from:', data.senderSocketId);
      const pc = peerConnections.current.get(data.senderSocketId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          await flushPendingIceCandidates(data.senderSocketId, pc);
        } catch (err: any) {
          console.error('[WebRTC] Error setting remote answer:', err);
        }
      }
    };

    // Receive ICE Candidate
    const handleSignalIceCandidate = async (data: {
      senderSocketId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      console.info(`[WebRTC] Received ICE candidate from ${data.senderSocketId}:`, data.candidate?.candidate);
      const pc = peerConnections.current.get(data.senderSocketId);
      if (!data.candidate) return;

      if (!pc || !pc.remoteDescription) {
        const queuedCandidates = pendingIceCandidates.current.get(data.senderSocketId) || [];
        queuedCandidates.push(data.candidate);
        pendingIceCandidates.current.set(data.senderSocketId, queuedCandidates);
        console.debug(`[WebRTC] Queued ICE candidate from ${data.senderSocketId}; remote description not set yet`);
      } else {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.debug(`[WebRTC] Added ICE candidate from ${data.senderSocketId}`);
        } catch (err: any) {
          console.error('[WebRTC] Error adding ICE candidate:', err);
        }
      }
    };

    // Participant Media State Updates
    const handleUserToggleAudio = (data: { socketId: string; isMuted: boolean }) => {
      setPeers((prev) => {
        const next = new Map(prev);
        const p = next.get(data.socketId);
        if (p) next.set(data.socketId, { ...p, isMuted: data.isMuted });
        return next;
      });
    };

    const handleUserToggleVideo = (data: { socketId: string; isVideoOff: boolean }) => {
      setPeers((prev) => {
        const next = new Map(prev);
        const p = next.get(data.socketId);
        if (p) next.set(data.socketId, { ...p, isVideoOff: data.isVideoOff });
        return next;
      });
    };

    const handleUserToggleScreenshare = (data: { socketId: string; isSharing: boolean }) => {
      setPeers((prev) => {
        const next = new Map(prev);
        const p = next.get(data.socketId);
        if (p) next.set(data.socketId, { ...p, isSharingScreen: data.isSharing });
        return next;
      });
    };

    const handleUserRaiseHand = (data: { socketId: string; isHandRaised: boolean; userName: string }) => {
      setPeers((prev) => {
        const next = new Map(prev);
        const p = next.get(data.socketId);
        if (p) next.set(data.socketId, { ...p, isHandRaised: data.isHandRaised });
        return next;
      });
    };

    // User left room
    const handleUserLeft = (data: { socketId: string; userName: string }) => {
      console.log('[WebRTC] Peer left room:', data.userName, data.socketId);
      const pc = peerConnections.current.get(data.socketId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(data.socketId);
      }
      setPeers((prev) => {
        const next = new Map(prev);
        next.delete(data.socketId);
        return next;
      });
    };

    socket.on('existing-participants', handleExistingParticipants);
    socket.on('user-joined', handleUserJoined);
    socket.on('signal-offer', handleSignalOffer);
    socket.on('signal-answer', handleSignalAnswer);
    socket.on('signal-ice-candidate', handleSignalIceCandidate);
    socket.on('user-toggle-audio', handleUserToggleAudio);
    socket.on('user-toggle-video', handleUserToggleVideo);
    socket.on('user-toggle-screenshare', handleUserToggleScreenshare);
    socket.on('user-raise-hand', handleUserRaiseHand);
    socket.on('user-left', handleUserLeft);

    return () => {
      active = false;
      socket.emit('leave-room', { roomId });

      socket.off('existing-participants', handleExistingParticipants);
      socket.off('user-joined', handleUserJoined);
      socket.off('signal-offer', handleSignalOffer);
      socket.off('signal-answer', handleSignalAnswer);
      socket.off('signal-ice-candidate', handleSignalIceCandidate);
      socket.off('user-toggle-audio', handleUserToggleAudio);
      socket.off('user-toggle-video', handleUserToggleVideo);
      socket.off('user-toggle-screenshare', handleUserToggleScreenshare);
      socket.off('user-raise-hand', handleUserRaiseHand);
      socket.off('user-left', handleUserLeft);
      socket.off('connect', handleSocketConnect);
      socket.off('disconnect', handleSocketDisconnect);

      // Clean up peer connections
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      pendingIceCandidates.current.clear();

      // Stop local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
      }
    };
  }, [socket, roomId, initializeMedia, createPeerConnection]);

  // Toggle Microphone
  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      const nextMuted = !isAudioMuted;
      audioTrack.enabled = !nextMuted;
      setIsAudioMuted(nextMuted);
      if (socket) {
        socket.emit('toggle-audio', { roomId, isMuted: nextMuted });
      }
    }
  }, [isAudioMuted, socket, roomId]);

  // Toggle Camera
  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      const nextVideoOff = !isVideoOff;
      videoTrack.enabled = !nextVideoOff;
      setIsVideoOff(nextVideoOff);
      if (socket) {
        socket.emit('toggle-video', { roomId, isVideoOff: nextVideoOff });
      }
    }
  }, [isVideoOff, socket, roomId]);

  // Toggle Screen Sharing
  const toggleScreenShare = useCallback(async () => {
    if (!socket) return;

    if (!isScreenSharing) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        const screenTrack = displayStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        // Replace video track in peer connections
        peerConnections.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        screenTrack.onended = () => {
          stopScreenSharing();
        };

        setIsScreenSharing(true);
        socket.emit('toggle-screenshare', { roomId, isSharing: true });
      } catch (err: any) {
        console.warn('[WebRTC] Screen share cancelled or rejected:', err);
      }
    } else {
      stopScreenSharing();
    }
  }, [isScreenSharing, socket, roomId]);

  const stopScreenSharing = useCallback(() => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    // Restore camera video track
    const cameraVideoTrack = localStreamRef.current?.getVideoTracks()[0] || null;
    peerConnections.current.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender && cameraVideoTrack) {
        sender.replaceTrack(cameraVideoTrack);
      }
    });

    setIsScreenSharing(false);
    if (socket) {
      socket.emit('toggle-screenshare', { roomId, isSharing: false });
    }
  }, [socket, roomId]);

  // Raise / Lower Hand
  const toggleRaiseHand = useCallback(() => {
    const nextHand = !isHandRaised;
    setIsHandRaised(nextHand);
    if (socket) {
      socket.emit('raise-hand', { roomId, isHandRaised: nextHand });
    }
  }, [isHandRaised, socket, roomId]);

  return {
    localStream,
    peers: Array.from(peers.values()),
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    isHandRaised,
    connectionError,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleRaiseHand,
  };
};
