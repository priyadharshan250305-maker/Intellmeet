import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { meetingService } from '../services';
import { Meeting } from '../types';
import { VideoTile } from '../components/VideoTile';
import { MeetingControls } from '../components/MeetingControls';
import { ChatDrawer } from '../components/ChatDrawer';
import { TranscriptionDrawer } from '../components/TranscriptionDrawer';
import { ConsentModal } from '../components/ConsentModal';
import {
  Lock,
  AlertCircle,
  Users,
  Shield,
  Sparkles,
  Wifi,
  PhoneOff,
} from 'lucide-react';

export const MeetingRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  // State
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [passcode, setPasscode] = useState('');
  const [guestName, setGuestName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Layout & Drawer states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [pinnedSocketId, setPinnedSocketId] = useState<string | null>(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Fetch meeting metadata
  useEffect(() => {
    if (!roomId) return;

    meetingService
      .getMeetingByRoomId(roomId)
      .then((res) => {
        if (res.data.success) {
          setMeeting(res.data.meeting);
          // If not private or host, auto-prompt join or ready
        }
      })
      .catch((err) => {
        setAuthError(err.response?.data?.message || 'Meeting room not found');
      })
      .finally(() => setLoading(false));
  }, [roomId]);

  // Current participant user info
  const participantInfo = useMemo(() => {
    return {
      id: user?.id,
      name: user?.name || guestName || 'Guest User',
      avatar: user?.avatar || '',
      role: meeting?.isHost ? 'host' : 'participant',
    };
  }, [user, guestName, meeting]);

  // Join handler
  const handleJoinMeeting = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!roomId) return;

    setAuthError(null);
    try {
      const res = await meetingService.joinMeeting(roomId, {
        passcode: passcode.trim(),
        guestName: guestName.trim() || undefined,
      });

      if (res.data.success) {
        setIsJoined(true);
        // Show consent modal on join
        setShowConsentModal(true);
      }
    } catch (err: any) {
      setAuthError(err.response?.data?.message || 'Unable to join meeting');
    }
  };

  // WebRTC Hook
  const {
    localStream,
    peers,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    isHandRaised,
    connectionError,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleRaiseHand,
  } = useWebRTC({
    socket: isJoined ? socket : null,
    roomId: roomId || '',
    user: participantInfo,
    initialMuted: meeting?.settings?.audioMutedOnEntry || false,
    initialVideoOff: meeting?.settings?.videoOffOnEntry || false,
  });

  // Speech Recognition & Live AI Transcription Hook
  const {
    isTranscribing,
    transcriptSegments,
    interimText,
    statusMessage,
    loadDemoTranscript,
  } = useSpeechRecognition({
    socket: isJoined ? socket : null,
    roomId: roomId || '',
    meetingId: meeting?.id || (meeting as any)?._id,
    speakerName: participantInfo.name,
    enabled: isJoined && !isAudioMuted,
    hasConsent,
  });

  // Leave Meeting Handler
  const handleLeaveMeeting = () => {
    const targetMeetingId = meeting?.id || (meeting as any)?._id;
    if (targetMeetingId) {
      navigate(`/meeting/${targetMeetingId}`);
    } else {
      navigate('/dashboard');
    }
  };

  // End Meeting Handler (Host only)
  const handleEndMeeting = async () => {
    if (!roomId) return;
    if (window.confirm('Are you sure you want to end this meeting for all participants?')) {
      try {
        await meetingService.endMeeting(roomId);
        handleLeaveMeeting();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to end meeting');
      }
    }
  };

  // Pre-join Lobby Screen
  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6 bg-slate-950 text-white">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 mb-3 border border-indigo-500/20">
              <Sparkles className="h-3.5 w-3.5" /> IntellMeet Room
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {meeting?.title || 'Video Conference'}
            </h2>
            <p className="mt-1 text-xs text-slate-400 font-mono tracking-wider">
              Room ID: {roomId}
            </p>
          </div>

          {authError && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs font-medium text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleJoinMeeting} className="space-y-4">
            {!user && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            )}

            {meeting?.requiresPasscode && !meeting?.isHost && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                  <span>Private Meeting Passcode *</span>
                </label>
                <input
                  type="password"
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full mt-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
            >
              Enter Meeting Room
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] text-slate-500">
            Microphone and camera permissions will be requested upon entering.
          </p>
        </div>
      </div>
    );
  }

  // Active Live Conference Room
  const allParticipantsCount = 1 + peers.length;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-slate-950 text-white overflow-hidden select-none">
      {/* Top Header Bar inside room */}
      <div className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950 px-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-slate-100 truncate max-w-xs sm:max-w-md">
            {meeting?.title || 'Meeting Session'}
          </h2>
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>WebRTC Connected</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span>{allParticipantsCount} in call</span>
          </span>
        </div>
      </div>

      {/* Main Video Grid and Drawers */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Video Tiles Grid Area */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto flex items-center justify-center">
          {connectionError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-xl bg-red-950/80 border border-red-500/40 px-4 py-2 text-xs text-red-200 shadow-xl backdrop-blur-md">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{connectionError}</span>
            </div>
          )}

          {/* Grid Layout adjusts based on participant count */}
          <div
            className={`w-full h-full grid gap-3 sm:gap-4 items-center justify-center max-w-7xl mx-auto ${
              allParticipantsCount === 1
                ? 'grid-cols-1 max-w-4xl max-h-[80vh]'
                : allParticipantsCount === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : allParticipantsCount <= 4
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {/* Local Video Tile */}
            <VideoTile
              stream={localStream}
              name={participantInfo.name}
              avatar={participantInfo.avatar}
              role={participantInfo.role}
              isLocal={true}
              isMuted={isAudioMuted}
              isVideoOff={isVideoOff}
              isSharingScreen={isScreenSharing}
              isHandRaised={isHandRaised}
              isPinned={pinnedSocketId === 'local'}
              onTogglePin={() =>
                setPinnedSocketId((prev) => (prev === 'local' ? null : 'local'))
              }
            />

            {/* Remote Peer Video Tiles */}
            {peers.map((peer) => (
              <VideoTile
                key={peer.socketId}
                stream={peer.stream}
                name={peer.name}
                avatar={peer.avatar}
                role={peer.role}
                isLocal={false}
                isMuted={peer.isMuted}
                isVideoOff={peer.isVideoOff}
                isSharingScreen={peer.isSharingScreen}
                isHandRaised={peer.isHandRaised}
                isPinned={pinnedSocketId === peer.socketId}
                onTogglePin={() =>
                  setPinnedSocketId((prev) =>
                    prev === peer.socketId ? null : peer.socketId
                  )
                }
              />
            ))}
          </div>
        </div>

        {/* In-Meeting Real-time Chat Drawer */}
        <ChatDrawer
          socket={socket}
          roomId={roomId || ''}
          currentUser={participantInfo}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onNewMessage={() => {
            if (!isChatOpen) setUnreadChatCount((prev) => prev + 1);
          }}
        />

        {/* Live AI Transcription Drawer */}
        <TranscriptionDrawer
          isOpen={isTranscriptOpen}
          onClose={() => setIsTranscriptOpen(false)}
          isTranscribing={isTranscribing}
          statusMessage={statusMessage}
          transcriptSegments={transcriptSegments}
          interimText={interimText}
          hasConsent={hasConsent}
          onRequestConsent={() => setShowConsentModal(true)}
          onLoadDemoTranscript={loadDemoTranscript}
        />
      </div>

      {/* Bottom Meeting Controls Bar */}
      <MeetingControls
        isMuted={isAudioMuted}
        isVideoOff={isVideoOff}
        isSharingScreen={isScreenSharing}
        isHandRaised={isHandRaised}
        isChatOpen={isChatOpen}
        isTranscriptOpen={isTranscriptOpen}
        unreadChatCount={unreadChatCount}
        roomId={roomId || ''}
        isHost={meeting?.isHost}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleRaiseHand={toggleRaiseHand}
        onToggleChat={() => {
          setIsChatOpen((prev) => !prev);
          setUnreadChatCount(0);
        }}
        onToggleTranscript={() => setIsTranscriptOpen((prev) => !prev)}
        onLeaveMeeting={handleLeaveMeeting}
        onEndMeeting={handleEndMeeting}
      />

      {/* Participant Notice & AI Transcription Consent Modal */}
      <ConsentModal
        isOpen={showConsentModal}
        onConsent={() => {
          setHasConsent(true);
          setShowConsentModal(false);
        }}
        onDecline={() => {
          setHasConsent(false);
          setShowConsentModal(false);
        }}
      />
    </div>
  );
};
