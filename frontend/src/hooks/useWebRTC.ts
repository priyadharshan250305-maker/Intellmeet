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
  const offersInProgress = useRef<Set<string>>(new Set());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const remoteStreams = useRef<Map<string, MediaStream>>(new Map());
  const pendingIceCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const isAudioMutedRef = useRef(initialMuted);
  const isVideoOffRef = useRef(initialVideoOff);
  const iceServersRef = useRef<RTCIceServer[]>([
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]);

  useEffect(() => {
    isAudioMutedRef.current = initialMuted;
    setIsAudioMuted(initialMuted);
  }, [initialMuted]);

  useEffect(() => {
    isVideoOffRef.current = initialVideoOff;
    setIsVideoOff(initialVideoOff);
  }, [initialVideoOff]);

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

  // Safely close and cleanup an existing RTCPeerConnection
  const closePeerConnection = useCallback((targetSocketId: string) => {
    const existing = peerConnections.current.get(targetSocketId);
    if (existing) {
      try {
        existing.ontrack = null;
        existing.onicecandidate = null;
        existing.oniceconnectionstatechange = null;
        existing.onconnectionstatechange = null;
        existing.onsignalingstatechange = null;
        existing.close();
      } catch (err) {
        console.warn(`[WebRTC] Error closing peer connection for ${targetSocketId}:`, err);
      }
      peerConnections.current.delete(targetSocketId);
    }
    offersInProgress.current.delete(targetSocketId);
    pendingIceCandidates.current.delete(targetSocketId);
    remoteStreams.current.delete(targetSocketId);
  }, []);

  // 1. Make sure getUserMedia({ audio: true, video: true }) is called when joining the meeting
  const initializeMedia = useCallback(async (): Promise<MediaStream | null> => {
    setConnectionError(null);

    // If we already have live local tracks, return existing stream
    const existingAudio = localStreamRef.current?.getAudioTracks().find((t) => t.readyState === 'live');
    const existingVideo = localStreamRef.current?.getVideoTracks().find((t) => t.readyState === 'live');
    if (existingAudio && existingVideo) {
      return localStreamRef.current;
    }

    let acquiredStream: MediaStream | null = null;
    try {
      // Primary attempt: Request both audio and video together in one unified getUserMedia call
      acquiredStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });
      console.info('[WebRTC] Acquired both audio and video via getUserMedia({ audio: true, video: true })');
    } catch (bothError: any) {
      console.warn('[WebRTC] Unified getUserMedia failed, attempting fallbacks:', bothError.name, bothError.message);
      // Fallback 1: Audio only
      try {
        acquiredStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        setConnectionError('Camera unavailable. Joined with microphone only.');
        console.info('[WebRTC] Acquired audio-only fallback stream');
      } catch (audioError: any) {
        // Fallback 2: Video only
        try {
          acquiredStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user',
            },
          });
          setConnectionError('Microphone unavailable. Joined with camera only.');
          console.info('[WebRTC] Acquired video-only fallback stream');
        } catch (videoError: any) {
          console.error('[WebRTC] All media device acquisitions failed:', videoError);
          setConnectionError('Microphone and camera are unavailable. Check browser permissions and devices.');
          return null;
        }
      }
    }

    if (!acquiredStream) return null;

    const audioTrack = acquiredStream.getAudioTracks()[0];
    const videoTrack = acquiredStream.getVideoTracks()[0];

    if (audioTrack) {
      audioTrack.enabled = !isAudioMutedRef.current;
    } else {
      isAudioMutedRef.current = true;
      setIsAudioMuted(true);
    }

    if (videoTrack) {
      videoTrack.enabled = !isVideoOffRef.current;
      isVideoOffRef.current = false;
      setIsVideoOff(false);
    } else {
      isVideoOffRef.current = true;
      setIsVideoOff(true);
    }

    localStreamRef.current = acquiredStream;
    setLocalStream(acquiredStream);

    return acquiredStream;
  }, []);

  // Create RTCPeerConnection for a remote peer with all local tracks attached
  const createPeerConnection = useCallback(
    (targetSocketId: string, peerInfo: Partial<PeerState> = {}): RTCPeerConnection | null => {
      if (!socket) return null;

      // 5. When an existing peer reconnects, do not reuse a dead/stale RTCPeerConnection
      // 6. Close/remove the old peer connection and create a fresh RTCPeerConnection when necessary
      const existingConnection = peerConnections.current.get(targetSocketId);
      if (existingConnection) {
        const isDeadOrFailed =
          existingConnection.signalingState === 'closed' ||
          existingConnection.connectionState === 'failed' ||
          existingConnection.connectionState === 'closed' ||
          existingConnection.iceConnectionState === 'failed' ||
          existingConnection.iceConnectionState === 'closed';

        if (isDeadOrFailed) {
          console.info(`[WebRTC] Closing stale/failed peer connection for ${targetSocketId}`);
          closePeerConnection(targetSocketId);
        } else {
          return existingConnection;
        }
      }

      // 7. Re-add the current local audio and video tracks to the fresh peer connection
      const pc = new RTCPeerConnection({
        iceServers: iceServersRef.current,
      });

      console.info(`[WebRTC] Created RTCPeerConnection for ${peerInfo.name || targetSocketId} (${targetSocketId})`);

      // 2. Make sure the local audio track is actually added to every newly-created RTCPeerConnection
      // 3. Make sure the local video track is actually added to every newly-created RTCPeerConnection
      // 4. When a new peer connection is created, it MUST receive the current local audio and video tracks BEFORE creating the offer
      const currentLocalStream = localStreamRef.current;
      if (currentLocalStream) {
        const liveTracks = currentLocalStream.getTracks().filter((track) => track.readyState === 'live');
        liveTracks.forEach((track) => {
          pc.addTrack(track, currentLocalStream);
          console.info(`[WebRTC] Added local ${track.kind} track (${track.id}) to peer connection ${targetSocketId}`);
        });

        // If local stream lacks audio or video, add a recvonly transceiver so we can receive that media type
        if (!liveTracks.some((t) => t.kind === 'audio')) {
          pc.addTransceiver('audio', { direction: 'recvonly' });
        }
        if (!liveTracks.some((t) => t.kind === 'video')) {
          pc.addTransceiver('video', { direction: 'recvonly' });
        }
      } else {
        pc.addTransceiver('audio', { direction: 'recvonly' });
        pc.addTransceiver('video', { direction: 'recvonly' });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('signal-ice-candidate', {
            targetSocketId,
            candidate: event.candidate,
          });
        }
      };

      // 8. Implement ontrack correctly:
      //    - Store incoming audio/video tracks in a remote MediaStream.
      //    - Assign that stream to the correct participant's video element.
      pc.ontrack = (event) => {
        console.info(`[WebRTC] ontrack received ${event.track.kind} track from ${targetSocketId}:`, {
          trackId: event.track.id,
          enabled: event.track.enabled,
          readyState: event.track.readyState,
        });

        let accumulatedStream = remoteStreams.current.get(targetSocketId);
        if (!accumulatedStream) {
          accumulatedStream = new MediaStream();
          remoteStreams.current.set(targetSocketId, accumulatedStream);
        }

        if (!accumulatedStream.getTracks().some((t) => t.id === event.track.id)) {
          accumulatedStream.addTrack(event.track);
        }

        // Create a new MediaStream instance wrapper containing all active tracks
        // so React detects a changed object reference and triggers re-render / useEffect in VideoTile
        const streamForState = new MediaStream(accumulatedStream.getTracks());

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
            stream: streamForState,
          });
          return next;
        });
      };

      pc.onconnectionstatechange = () => {
        console.info(`[WebRTC] Connection state with ${targetSocketId}:`, pc.connectionState);
        if (pc.connectionState === 'failed') {
          console.warn(`[WebRTC] Connection failed with ${targetSocketId}`);
        }
      };

      peerConnections.current.set(targetSocketId, pc);
      return pc;
    },
    [socket, closePeerConnection]
  );

  // Set up signaling listeners and join room
  useEffect(() => {
    if (!socket || !roomId) return;

    let active = true;
    let hasJoinedRoom = false;

    const joinSocketRoom = async () => {
      if (!active || !socket.connected || hasJoinedRoom) return;

      const stream = await initializeMedia();
      if (!active || !socket.connected || !stream) return;

      hasJoinedRoom = true;
      console.info('[WebRTC] Joining Socket.IO room with local media ready:', {
        roomId,
        socketId: socket.id,
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length,
      });

      socket.emit('join-room', {
        roomId,
        user,
        isMuted: isAudioMutedRef.current,
        isVideoOff: isVideoOffRef.current,
      });
    };

    const handleSocketConnect = () => {
      console.info('[WebRTC] Socket connected for room:', roomId, socket.id);
      hasJoinedRoom = false;
      void joinSocketRoom();
    };

    const handleSocketDisconnect = (reason: string) => {
      console.warn('[WebRTC] Socket disconnected from room:', roomId, reason);
      hasJoinedRoom = false;
    };

    socket.on('connect', handleSocketConnect);
    socket.on('disconnect', handleSocketDisconnect);

    if (socket.connected) {
      void joinSocketRoom();
    }

    // Flush queued ICE candidates after remote description is set
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

    // 12. Do not create duplicate peer connections for the same participant
    // 13. Do not create duplicate offers for the same participant
    const createAndSendOffer = async (peerInfo: PeerState) => {
      if (!active || !socket || !socket.connected) return;
      if (peerInfo.socketId === socket.id) return;
      if (offersInProgress.current.has(peerInfo.socketId)) return;

      offersInProgress.current.add(peerInfo.socketId);
      try {
        const stream = localStreamRef.current || (await initializeMedia());
        if (!active || !socket.connected || !stream) return;

        const pc = createPeerConnection(peerInfo.socketId, peerInfo);
        if (!pc) return;

        if (pc.signalingState !== 'stable') {
          console.warn(`[WebRTC] Signaling state for ${peerInfo.socketId} is not stable (${pc.signalingState}); skipping duplicate offer`);
          return;
        }

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.info(`[WebRTC] Sending offer to ${peerInfo.socketId}; signaling state:`, pc.signalingState);

        socket.emit('signal-offer', {
          targetSocketId: peerInfo.socketId,
          offer,
        });
      } catch (err) {
        console.error(`[WebRTC] Error creating offer for ${peerInfo.socketId}:`, err);
      } finally {
        offersInProgress.current.delete(peerInfo.socketId);
      }
    };

    // Received existing participants list upon joining
    // The newly joined user waits for offers from existing peers to avoid offer collisions
    const handleExistingParticipants = (existing: PeerState[]) => {
      console.info('[WebRTC] Received existing participants:', existing);
      if (!socket.id) return;

      const remoteParticipants = existing.filter((peer) => peer.socketId !== socket.id);
      setPeers((prev) => {
        const next = new Map(prev);
        remoteParticipants.forEach((peer) => {
          const current = next.get(peer.socketId);
          next.set(peer.socketId, {
            ...peer,
            stream: current?.stream,
          });
        });
        return next;
      });
    };

    // A new user joined the room -> existing peers initiate the WebRTC offer
    const handleUserJoined = async (peerInfo: PeerState) => {
      console.info('[WebRTC] New user joined room:', peerInfo);
      if (peerInfo.socketId === socket.id) return;

      setPeers((prev) => {
        const next = new Map(prev);
        const current = next.get(peerInfo.socketId);
        next.set(peerInfo.socketId, {
          ...peerInfo,
          stream: current?.stream,
        });
        return next;
      });

      // Existing participant initiates the offer to the newly joined peer
      await createAndSendOffer(peerInfo);
    };

    // Receive WebRTC Offer
    const handleSignalOffer = async (data: { senderSocketId: string; offer: RTCSessionDescriptionInit }) => {
      console.info('[WebRTC] Received offer from:', data.senderSocketId);
      if (!active || !socket || !socket.connected) return;

      // Ensure local media tracks exist before responding to the offer
      if (!localStreamRef.current) {
        await initializeMedia();
      }

      let pc = peerConnections.current.get(data.senderSocketId);
      if (
        pc &&
        (pc.signalingState === 'closed' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed' ||
          pc.iceConnectionState === 'failed')
      ) {
        closePeerConnection(data.senderSocketId);
        pc = undefined;
      }

      if (!pc) {
        const peerState = peers.get(data.senderSocketId) || {};
        pc = createPeerConnection(data.senderSocketId, peerState)!;
      }

      if (!pc) return;

      try {
        // In case of an offer collision while in have-local-offer state, rollback to accept incoming offer
        if (pc.signalingState !== 'stable') {
          console.warn(`[WebRTC] Offer collision on ${data.senderSocketId}, rolling back local offer`);
          await pc.setLocalDescription({ type: 'rollback' });
        }

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
    };

    // Receive WebRTC Answer
    const handleSignalAnswer = async (data: { senderSocketId: string; answer: RTCSessionDescriptionInit }) => {
      console.info('[WebRTC] Received answer from:', data.senderSocketId);
      const pc = peerConnections.current.get(data.senderSocketId);
      if (pc) {
        try {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            await flushPendingIceCandidates(data.senderSocketId, pc);
            console.info(`[WebRTC] Remote answer applied for ${data.senderSocketId}; signaling state:`, pc.signalingState);
          } else {
            console.warn(`[WebRTC] Received answer for ${data.senderSocketId} in unexpected state:`, pc.signalingState);
          }
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
      if (!data.candidate) return;
      const pc = peerConnections.current.get(data.senderSocketId);

      if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) {
        const queuedCandidates = pendingIceCandidates.current.get(data.senderSocketId) || [];
        queuedCandidates.push(data.candidate);
        pendingIceCandidates.current.set(data.senderSocketId, queuedCandidates);
      } else {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
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
      console.info('[WebRTC] Peer left room:', data.userName, data.socketId);
      closePeerConnection(data.socketId);
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

      // Clean up all peer connections
      peerConnections.current.forEach((pc) => {
        try {
          pc.ontrack = null;
          pc.onicecandidate = null;
          pc.close();
        } catch (_) {}
      });
      peerConnections.current.clear();
      offersInProgress.current.clear();
      pendingIceCandidates.current.clear();
      remoteStreams.current.clear();

      // Stop local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
    };
  }, [socket, roomId, user, initializeMedia, createPeerConnection, closePeerConnection]);

  // 15. Microphone and camera controls must work independently:
  //     - If microphone is enabled, the audio track must be live and sent.
  //     - Toggling mute must update the corresponding sender track.
  //     - Do not destroy the other media track when toggling one control.
  // 16. If a local track becomes ended/missing, reacquire that specific track and use RTCRtpSender.replaceTrack()
  const toggleAudio = useCallback(async () => {
    const nextMuted = !isAudioMuted;
    let audioTrack = localStreamRef.current?.getAudioTracks().find((track) => track.readyState === 'live');

    if (!nextMuted && !audioTrack) {
      // Reacquire audio track without touching camera video track
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = true;
          const liveVideoTracks = localStreamRef.current?.getVideoTracks().filter((t) => t.readyState === 'live') || [];
          const updatedStream = new MediaStream([...liveVideoTracks, audioTrack]);
          localStreamRef.current = updatedStream;
          setLocalStream(updatedStream);

          // Update existing peer connection audio senders
          for (const pc of peerConnections.current.values()) {
            const sender = pc.getSenders().find((s) => s.track?.kind === 'audio' || (!s.track && s.transport));
            if (sender) {
              await sender.replaceTrack(audioTrack);
            } else {
              pc.addTrack(audioTrack, updatedStream);
            }
          }
        }
      } catch (err) {
        console.error('[WebRTC] Failed to reacquire audio track:', err);
        return;
      }
    }

    if (audioTrack) {
      audioTrack.enabled = !nextMuted;
    }
    isAudioMutedRef.current = nextMuted;
    setIsAudioMuted(nextMuted);
    socket?.emit('toggle-audio', { roomId, isMuted: nextMuted });
  }, [isAudioMuted, socket, roomId]);

  // 15. Camera controls work independently without affecting audio track:
  //     - If camera is enabled, the video track must be live and sent.
  //     - Toggling camera must update the corresponding sender track.
  // 16. If video track is ended/missing, reacquire and replaceTrack
  const toggleVideo = useCallback(async () => {
    const nextVideoOff = !isVideoOff;
    let videoTrack = localStreamRef.current?.getVideoTracks().find((track) => track.readyState === 'live');

    if (!nextVideoOff && !videoTrack) {
      // Reacquire camera video track without touching microphone audio track
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
        });
        videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = true;
          const liveAudioTracks = localStreamRef.current?.getAudioTracks().filter((t) => t.readyState === 'live') || [];
          const updatedStream = new MediaStream([...liveAudioTracks, videoTrack]);
          localStreamRef.current = updatedStream;
          setLocalStream(updatedStream);

          // Update existing peer connection video senders
          for (const pc of peerConnections.current.values()) {
            const sender = pc.getSenders().find((s) => s.track?.kind === 'video' || (!s.track && s.transport));
            if (sender) {
              await sender.replaceTrack(videoTrack);
            } else {
              pc.addTrack(videoTrack, updatedStream);
            }
          }
        }
      } catch (err) {
        console.error('[WebRTC] Failed to reacquire video track:', err);
        return;
      }
    }

    if (videoTrack) {
      videoTrack.enabled = !nextVideoOff;
    }
    isVideoOffRef.current = nextVideoOff;
    setIsVideoOff(nextVideoOff);
    socket?.emit('toggle-video', { roomId, isVideoOff: nextVideoOff });
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

        // Replace video track in all peer connections
        for (const pc of peerConnections.current.values()) {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(screenTrack);
          }
        }

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

  const stopScreenSharing = useCallback(async () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    // Restore camera video track on peer connections
    const cameraVideoTrack = localStreamRef.current?.getVideoTracks().find((t) => t.readyState === 'live') || null;
    for (const pc of peerConnections.current.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender && cameraVideoTrack) {
        await sender.replaceTrack(cameraVideoTrack);
      }
    }

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
