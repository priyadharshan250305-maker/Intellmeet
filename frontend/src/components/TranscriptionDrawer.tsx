import React from 'react';
import { TranscriptSegment } from '../types';
import { X, Sparkles, Mic, AlertCircle, Database, CheckCircle2 } from 'lucide-react';

interface TranscriptionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isTranscribing: boolean;
  statusMessage: string;
  transcriptSegments: TranscriptSegment[];
  interimText: string;
  hasConsent: boolean;
  onRequestConsent: () => void;
  onLoadDemoTranscript: () => void;
}

export const TranscriptionDrawer: React.FC<TranscriptionDrawerProps> = ({
  isOpen,
  onClose,
  isTranscribing,
  statusMessage,
  transcriptSegments,
  interimText,
  hasConsent,
  onRequestConsent,
  onLoadDemoTranscript,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 w-full sm:w-96 md:relative md:inset-auto md:w-80 lg:w-96 flex flex-col border-l border-slate-800 bg-slate-900 h-full text-slate-100 shrink-0 shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Live AI Transcription</h3>
            <p className="text-[11px] text-slate-400">Real-time speech-to-text pipeline</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Consent & Status Banner */}
      <div className="border-b border-slate-800 p-3 bg-slate-950/60">
        {!hasConsent ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Participant Notice Required</span>
            </div>
            <p className="text-[11px] text-amber-200/80 mt-1">
              Audio transcription requires all meeting participants to provide explicit consent.
            </p>
            <button
              onClick={onRequestConsent}
              className="mt-2 w-full rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition-colors"
            >
              Review & Provide Consent
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`relative flex h-2.5 w-2.5 ${isTranscribing ? 'animate-ping' : ''}`}>
                <span
                  className={`inline-flex h-full w-full rounded-full ${
                    isTranscribing ? 'bg-emerald-400' : 'bg-slate-500'
                  }`}
                />
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {isTranscribing ? 'Listening & Transcribing' : 'Standby'}
              </span>
            </div>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Consent Active
            </span>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate pr-2">{statusMessage}</span>
          <button
            onClick={onLoadDemoTranscript}
            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline shrink-0"
            title="Load structured demo transcript for testing summary extraction"
          >
            <Database className="h-3 w-3" /> Load Demo
          </button>
        </div>
      </div>

      {/* Live Transcript Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {transcriptSegments.length === 0 && !interimText ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 p-4">
            <Mic className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-xs font-medium text-slate-400">No speech recorded yet.</p>
            <p className="text-[11px] mt-1 text-slate-500">
              Speak into your microphone to generate live speech segments, or click "Load Demo" above to test AI summarization.
            </p>
          </div>
        ) : (
          <>
            {transcriptSegments.map((segment, idx) => {
              const isDemo = segment.source === 'demo';
              return (
                <div
                  key={segment._id || segment.id || idx}
                  className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-indigo-300">
                      {segment.speakerName}
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Clearly distinguish actual transcription from demo data */}
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          isDemo
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {isDemo ? 'Demo Data' : 'Live Speech'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {segment.startTime}s - {segment.endTime}s
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">{segment.text}</p>
                </div>
              );
            })}

            {/* Interim live speech preview */}
            {interimText && (
              <div className="rounded-xl border border-dashed border-purple-500/40 bg-purple-950/20 p-3 animate-pulse">
                <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-wider">
                  Listening...
                </span>
                <p className="text-xs text-purple-200 mt-1 italic">{interimText}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t border-slate-800 p-3 text-center text-[10px] text-slate-500">
        Segments are preserved for AI Executive Summary & Action Item extraction.
      </div>
    </div>
  );
};
