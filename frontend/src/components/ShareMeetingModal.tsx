import React, { useState } from 'react';
import { X, Copy, Check, Share2, Globe, Shield, Sparkles } from 'lucide-react';

interface ShareMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  meetingTitle?: string;
}

export const ShareMeetingModal: React.FC<ShareMeetingModalProps> = ({
  isOpen,
  onClose,
  roomId,
  meetingTitle,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  if (!isOpen) return null;

  const origin = window.location.origin;
  const cleanRoomId = (roomId || '').trim();
  const meetingUrl = cleanRoomId
    ? `${origin}/room/${cleanRoomId}`
    : window.location.href.split('?')[0].split('#')[0];

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(meetingUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = meetingUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Failed to copy meeting link:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: meetingTitle || 'IntellMeet Video Conference',
          text: `Join my IntellMeet meeting: ${meetingTitle || 'Meeting Session'}`,
          url: meetingUrl,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch (err: any) {
        // User cancelled or aborted share
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const isNativeShareSupported = typeof navigator !== 'undefined' && Boolean(navigator.share);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6 text-white shadow-2xl animate-in slide-in-from-bottom duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Share Meeting</h3>
              <p className="text-xs text-slate-400">Invite participants with direct link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Meeting Details Info Box */}
        <div className="my-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Meeting Title
            </span>
            <p className="text-sm font-semibold text-slate-200 mt-0.5 truncate">
              {meetingTitle || 'Meeting Session'}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Meeting ID
            </span>
            <p className="text-sm font-mono font-semibold text-indigo-400 mt-0.5 select-all">
              {cleanRoomId}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Direct Meeting Link
            </span>
            <div className="mt-1 flex items-center rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs font-mono text-slate-300">
              <span className="truncate select-all flex-1">{meetingUrl}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Primary Share Action */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 active:scale-[0.99] transition-all"
          >
            {isNativeShareSupported ? (
              <>
                <Share2 className="h-4 w-4" />
                <span>{shareSuccess ? 'Shared!' : 'Share via Apps...'}</span>
              </>
            ) : (
              <>
                {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Meeting Link Copied!' : 'Copy Meeting Link'}</span>
              </>
            )}
          </button>

          {/* Copy Link button (secondary if native share supported) */}
          {isNativeShareSupported && (
            <button
              type="button"
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700/80 active:scale-[0.99] transition-all"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Guest access notice */}
        <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
          <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>Anyone with this link can join directly as a guest without signing in.</span>
        </div>
      </div>
    </div>
  );
};
