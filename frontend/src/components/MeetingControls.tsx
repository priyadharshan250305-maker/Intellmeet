import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  Hand,
  Smile,
  MessageSquare,
  FileText,
  PhoneOff,
  Copy,
  Check,
  Users,
  Sparkles,
  MoreVertical,
} from 'lucide-react';
import { ReactionPicker } from './ReactionPicker';

export interface MeetingControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isSharingScreen: boolean;
  isHandRaised: boolean;
  isChatOpen: boolean;
  isTranscriptOpen: boolean;
  isParticipantsOpen?: boolean;
  isSummaryOpen?: boolean;
  unreadChatCount?: number;
  participantsCount?: number;
  roomId: string;
  isHost?: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleRaiseHand: () => void;
  onToggleChat: () => void;
  onToggleTranscript: () => void;
  onToggleParticipants?: () => void;
  onToggleSummary?: () => void;
  onToggleShare?: () => void;
  onOpenMoreMenu?: () => void;
  onLeaveMeeting: () => void;
  onEndMeeting?: () => void;
  onSendReaction?: (emoji: string) => void;
}

export const MeetingControls: React.FC<MeetingControlsProps> = ({
  isMuted,
  isVideoOff,
  isSharingScreen,
  isHandRaised,
  isChatOpen,
  isTranscriptOpen,
  isParticipantsOpen = false,
  isSummaryOpen = false,
  unreadChatCount = 0,
  participantsCount = 1,
  roomId,
  isHost = false,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleRaiseHand,
  onToggleChat,
  onToggleTranscript,
  onToggleParticipants,
  onToggleSummary,
  onToggleShare,
  onOpenMoreMenu,
  onLeaveMeeting,
  onEndMeeting,
  onSendReaction,
}) => {
  const [copied, setCopied] = useState(false);
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);

  const copyMeetingLink = () => {
    const origin = window.location.origin;
    const cleanRoomId = (roomId || '').trim();
    const url = cleanRoomId
      ? `${origin}/room/${cleanRoomId}`
      : window.location.href.split('?')[0].split('#')[0];
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex w-full items-center justify-between border-t border-slate-800 bg-slate-950/95 px-3 py-2.5 sm:px-4 sm:py-3 backdrop-blur-md relative z-30">
      {/* =========================================
          DESKTOP LAYOUT (md:flex)
          ========================================= */}

      {/* Desktop Left: Meeting Info, Copy Link, Share Modal Button */}
      <div className="hidden md:flex items-center gap-2.5">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-medium">Meeting Room</span>
          <span className="text-xs font-semibold tracking-wide text-slate-200 font-mono">{roomId}</span>
        </div>
        <button
          onClick={copyMeetingLink}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          title="Copy meeting link to clipboard"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
        {onToggleShare && (
          <button
            onClick={onToggleShare}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            title="Share meeting with guests"
          >
            <Share2 className="h-3.5 w-3.5 text-indigo-400" />
            <span>Share</span>
          </button>
        )}
      </div>

      {/* Desktop Center: Mic, Camera, ScreenShare, Hand, Reaction, Leave, End Call */}
      <div className="hidden md:flex items-center gap-2.5">
        {/* Mic Toggle */}
        <button
          onClick={onToggleAudio}
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all shadow-md ${
            isMuted
              ? 'bg-red-600 text-white hover:bg-red-500 shadow-red-600/30'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        {/* Video Toggle */}
        <button
          onClick={onToggleVideo}
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all shadow-md ${
            isVideoOff
              ? 'bg-red-600 text-white hover:bg-red-500 shadow-red-600/30'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
          }`}
          title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
        >
          {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </button>

        {/* Screen Share Toggle */}
        <button
          onClick={onToggleScreenShare}
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all shadow-md ${
            isSharingScreen
              ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/30'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
          }`}
          title={isSharingScreen ? 'Stop sharing screen' : 'Share your screen'}
        >
          <Share2 className="h-5 w-5" />
        </button>

        {/* Raise Hand Toggle */}
        <button
          onClick={onToggleRaiseHand}
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all shadow-md ${
            isHandRaised
              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold shadow-amber-500/30'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
          }`}
          title={isHandRaised ? 'Lower hand' : 'Raise hand'}
        >
          <Hand className="h-5 w-5" />
        </button>

        {/* Reaction Emoji Picker */}
        {onSendReaction && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsReactionPickerOpen((prev) => !prev)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all shadow-md ${
                isReactionPickerOpen
                  ? 'bg-indigo-600 text-white shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
              }`}
              title="Send a reaction"
            >
              <Smile className="h-5 w-5" />
            </button>

            <ReactionPicker
              isOpen={isReactionPickerOpen}
              onClose={() => setIsReactionPickerOpen(false)}
              onSelectReaction={onSendReaction}
            />
          </div>
        )}

        {/* Leave Meeting */}
        <button
          onClick={onLeaveMeeting}
          className="flex h-11 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-md shadow-red-600/30 hover:bg-red-500 transition-all ml-1"
          title="Leave meeting"
        >
          <PhoneOff className="h-4 w-4" />
          <span>Leave</span>
        </button>

        {/* End Meeting for All (Host only) */}
        {isHost && onEndMeeting && (
          <button
            onClick={onEndMeeting}
            className="flex h-11 items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-950/40 px-3 text-xs font-semibold text-red-300 hover:bg-red-900/60 transition-all"
            title="End meeting for all participants"
          >
            End Call
          </button>
        )}
      </div>

      {/* Desktop Right: Drawers (Participants, Chat, AI Summary, AI Transcript) */}
      <div className="hidden md:flex items-center gap-2">
        {/* Participants Drawer Toggle */}
        {onToggleParticipants && (
          <button
            onClick={onToggleParticipants}
            className={`flex h-10 items-center gap-1.5 rounded-xl px-3 transition-all ${
              isParticipantsOpen
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title="Meeting participants"
          >
            <Users className="h-4 w-4" />
            <span className="text-xs font-semibold">{participantsCount}</span>
          </button>
        )}

        {/* Chat Drawer Toggle */}
        <button
          onClick={onToggleChat}
          className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
            isChatOpen
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
          title="Meeting chat"
        >
          <MessageSquare className="h-4 w-4" />
          {unreadChatCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white ring-2 ring-slate-950">
              {unreadChatCount}
            </span>
          )}
        </button>

        {/* AI Summary Modal Toggle */}
        {onToggleSummary && (
          <button
            onClick={onToggleSummary}
            className={`flex h-10 items-center gap-1.5 rounded-xl px-3 transition-all ${
              isSummaryOpen
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-800 text-indigo-300 hover:bg-slate-700 hover:text-white border border-indigo-500/20'
            }`}
            title="AI Meeting Summary & Action Items"
          >
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-semibold">AI Summary</span>
          </button>
        )}

        {/* Live Transcription Drawer Toggle */}
        <button
          onClick={onToggleTranscript}
          className={`flex h-10 items-center gap-1.5 rounded-xl px-3 transition-all ${
            isTranscriptOpen
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
          title="AI Live Transcription & Insights"
        >
          <FileText className="h-4 w-4" />
          <span className="text-xs font-medium">AI Transcript</span>
        </button>
      </div>

      {/* =========================================
          MOBILE LAYOUT (< md)
          6 touch-friendly buttons:
          Mic | Video | Chat | Participants | More | Leave
          ========================================= */}
      <div className="flex md:hidden w-full items-center justify-between gap-1">
        {/* 1. Mic */}
        <button
          onClick={onToggleAudio}
          className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all shadow-md active:scale-95 ${
            isMuted
              ? 'bg-red-600 text-white shadow-red-600/30'
              : 'bg-slate-800 text-slate-200 active:bg-slate-700'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        {/* 2. Video */}
        <button
          onClick={onToggleVideo}
          className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all shadow-md active:scale-95 ${
            isVideoOff
              ? 'bg-red-600 text-white shadow-red-600/30'
              : 'bg-slate-800 text-slate-200 active:bg-slate-700'
          }`}
          title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
        >
          {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </button>

        {/* 3. Chat */}
        <button
          onClick={onToggleChat}
          className={`relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all shadow-md active:scale-95 ${
            isChatOpen
              ? 'bg-indigo-600 text-white shadow-indigo-600/30'
              : 'bg-slate-800 text-slate-200 active:bg-slate-700'
          }`}
          title="Meeting chat"
        >
          <MessageSquare className="h-5 w-5" />
          {unreadChatCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white ring-2 ring-slate-950">
              {unreadChatCount}
            </span>
          )}
        </button>

        {/* 4. Participants */}
        {onToggleParticipants && (
          <button
            onClick={onToggleParticipants}
            className={`relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all shadow-md active:scale-95 ${
              isParticipantsOpen
                ? 'bg-indigo-600 text-white shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-200 active:bg-slate-700'
            }`}
            title="Participants"
          >
            <Users className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-indigo-300 ring-2 ring-slate-950">
              {participantsCount}
            </span>
          </button>
        )}

        {/* 5. More Menu Sheet */}
        <button
          onClick={onOpenMoreMenu}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-200 active:bg-slate-700 transition-all shadow-md active:scale-95"
          title="More options (AI Summary, Share, Screen share, Reactions, Hand)"
        >
          <MoreVertical className="h-5 w-5" />
        </button>

        {/* 6. Leave */}
        <button
          onClick={onLeaveMeeting}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md shadow-red-600/30 active:bg-red-500 active:scale-95 transition-all"
          title="Leave meeting"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};