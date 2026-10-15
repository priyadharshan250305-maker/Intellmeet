import React from 'react';
import { ShieldCheck, Mic, FileText, Check, X } from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  onConsent: () => void;
  onDecline: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onConsent,
  onDecline,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 mb-4">
          <ShieldCheck className="h-6 w-6" />
        </div>

        <h3 className="text-lg font-bold text-white">
          Participant Notice & AI Transcription Consent
        </h3>

        <p className="mt-2 text-sm text-slate-300 leading-relaxed">
          IntellMeet uses automated speech-to-text intelligence to record meeting dialogue,
          generate executive summaries, and extract assigned action items.
        </p>

        <div className="mt-4 space-y-2.5 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-slate-300">
            <Mic className="h-4 w-4 text-indigo-400" />
            <span>Audio is processed solely for meeting transcription.</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <FileText className="h-4 w-4 text-purple-400" />
            <span>Transcripts are securely stored in MongoDB with workspace RBAC.</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onDecline}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" /> Decline
          </button>
          <button
            onClick={onConsent}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
          >
            <Check className="h-4 w-4" /> I Agree & Give Consent
          </button>
        </div>
      </div>
    </div>
  );
};
