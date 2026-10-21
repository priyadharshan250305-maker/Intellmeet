import React from 'react';
import {
  X,
  Sparkles,
  Share2,
  Copy,
  Users,
  MessageSquare,
  Hand,
  Smile,
  FileText,
  Maximize2,
  PhoneOff,
  Check,
  Shield,
  Info,
} from 'lucide-react';

interface MobileMoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  meetingTitle?: string;
  isHost?: boolean;
  isHandRaised: boolean;
  isSharingScreen: boolean;
  unreadChatCount?: number;
  participantsCount: number;
  copied: boolean;
  onOpenSummary: () => void;
  onOpenShare: () => void;
  onCopyLink: () => void;
  onOpenParticipants: () => void;
  onOpenChat: () => void;
  onOpenTranscript: () => void;
  onToggleRaiseHand: () => void;
  onOpenReactions: () => void;
  onToggleScreenShare: () => void;
  onLeaveMeeting: () => void;
  onEndMeeting?: () => void;
}

export const MobileMoreMenu: React.FC<MobileMoreMenuProps> = ({
  isOpen,
  onClose,
  roomId,
  meetingTitle,
  isHost = false,
  isHandRaised,
  isSharingScreen,
  unreadChatCount = 0,
  participantsCount,
  copied,
  onOpenSummary,
  onOpenShare,
  onCopyLink,
  onOpenParticipants,
  onOpenChat,
  onOpenTranscript,
  onToggleRaiseHand,
  onOpenReactions,
  onToggleScreenShare,
  onLeaveMeeting,
  onEndMeeting,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[88vh] overflow-y-auto rounded-t-3xl border-t border-slate-800 bg-slate-900 p-5 text-white shadow-2xl animate-in slide-in-from-bottom duration-250 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-700/80" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white">Meeting Options</h3>
            <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
              {meetingTitle || 'IntellMeet Room'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Grid Actions (Top Tier) */}
        <div className="grid grid-cols-3 gap-2.5 my-4">
          {/* AI Summary Button */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSummary();
            }}
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-3 text-center active:scale-95 transition-all hover:bg-indigo-900/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-bold text-indigo-300">AI Summary</span>
          </button>

          {/* Share Meeting */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenShare();
            }}
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-center active:scale-95 transition-all hover:bg-slate-800"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
              <Share2 className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-200">Share Link</span>
          </button>

          {/* Copy Link */}
          <button
            type="button"
            onClick={onCopyLink}
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-center active:scale-95 transition-all hover:bg-slate-800"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </div>
            <span className={`text-[11px] font-semibold ${copied ? 'text-emerald-400' : 'text-slate-200'}`}>
              {copied ? 'Copied!' : 'Copy Link'}
            </span>
          </button>
        </div>

        {/* Detailed Action List Rows */}
        <div className="space-y-1.5 border-t border-slate-800 pt-3">
          {/* Participants */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenParticipants();
            }}
            className="flex w-full items-center justify-between rounded-xl p-3 text-left hover:bg-slate-800/60 active:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                <Users className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">View Participants</span>
            </div>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-indigo-400 border border-slate-700">
              {participantsCount}
            </span>
          </button>

          {/* In-Meeting Chat */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenChat();
            }}
            className="flex w-full items-center justify-between rounded-xl p-3 text-left hover:bg-slate-800/60 active:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                <MessageSquare className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">In-Meeting Chat</span>
            </div>
            {unreadChatCount > 0 && (
              <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {unreadChatCount} new
              </span>
            )}
          </button>

          {/* Live AI Transcription */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenTranscript();
            }}
            className="flex w-full items-center justify-between rounded-xl p-3 text-left hover:bg-slate-800/60 active:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">Live AI Transcript</span>
            </div>
            <span className="text-[10px] font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
              Live Speech
            </span>
          </button>

          {/* Raise / Lower Hand */}
          <button
            type="button"
            onClick={() => {
              onToggleRaiseHand();
            }}
            className={`flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors ${
              isHandRaised ? 'bg-amber-500/20 border border-amber-500/30' : 'hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  isHandRaised ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                }`}
              >
                <Hand className="h-4 w-4" />
              </div>
              <span className={`text-xs font-semibold ${isHandRaised ? 'text-amber-300' : 'text-slate-200'}`}>
                {isHandRaised ? 'Hand Raised (Tap to Lower)' : 'Raise Hand'}
              </span>
            </div>
            {isHandRaised && (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                Active
              </span>
            )}
          </button>

          {/* Send Emoji Reaction */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenReactions();
            }}
            className="flex w-full items-center justify-between rounded-xl p-3 text-left hover:bg-slate-800/60 active:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                <Smile className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">Send Reaction Emoji</span>
            </div>
            <span className="text-sm">👍 ❤️ 😂</span>
          </button>

          {/* Screen Share */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onToggleScreenShare();
            }}
            className={`flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors ${
              isSharingScreen ? 'bg-blue-500/20 border border-blue-500/30' : 'hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  isSharingScreen ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                <Maximize2 className="h-4 w-4" />
              </div>
              <span className={`text-xs font-semibold ${isSharingScreen ? 'text-blue-300' : 'text-slate-200'}`}>
                {isSharingScreen ? 'Stop Sharing Screen' : 'Share Screen'}
              </span>
            </div>
            {isSharingScreen && (
              <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white">
                Sharing
              </span>
            )}
          </button>
        </div>

        {/* Room Info Footer */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Room: <span className="font-mono text-slate-300">{roomId}</span></span>
          </div>
          {isHost && (
            <span className="flex items-center gap-1 text-indigo-400 font-semibold shrink-0">
              <Shield className="h-3 w-3" /> Host
            </span>
          )}
        </div>

        {/* Leave / End Call Buttons */}
        <div className="mt-4 space-y-2">
          {isHost && onEndMeeting && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEndMeeting();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-950/50 py-3 text-xs font-bold text-red-300 hover:bg-red-900/60 active:scale-98 transition-colors"
            >
              End Meeting for All
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              onLeaveMeeting();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-xs font-bold text-white shadow-md shadow-red-600/30 hover:bg-red-500 active:scale-98 transition-all"
          >
            <PhoneOff className="h-4 w-4" />
            <span>Leave Meeting</span>
          </button>
        </div>
      </div>
    </div>
  );
};
