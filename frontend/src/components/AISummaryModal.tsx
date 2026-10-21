import React, { useState, useEffect } from 'react';
import { aiService } from '../services';
import { MeetingSummary, ActionItem } from '../types';
import {
  Sparkles,
  X,
  RefreshCw,
  CheckCircle2,
  ListChecks,
  AlertTriangle,
  HelpCircle,
  Clock,
  ArrowRight,
  FileText,
} from 'lucide-react';

interface AISummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId?: string;
  meetingTitle?: string;
  onOpenTranscript?: () => void;
}

export const AISummaryModal: React.FC<AISummaryModalProps> = ({
  isOpen,
  onClose,
  meetingId,
  meetingTitle,
  onOpenTranscript,
}) => {
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'tasks'>('summary');

  // Load existing summary on modal open
  useEffect(() => {
    if (!isOpen || !meetingId) return;

    let isMounted = true;
    const fetchExisting = async () => {
      try {
        setLoading(true);
        setError(null);
        const [sumRes, taskRes] = await Promise.allSettled([
          aiService.getSummary(meetingId),
          aiService.getActionItems(meetingId),
        ]);

        if (!isMounted) return;

        if (sumRes.status === 'fulfilled' && sumRes.value.data.success) {
          setSummary(sumRes.value.data.summary);
        } else {
          setSummary(null);
        }

        if (taskRes.status === 'fulfilled' && taskRes.value.data.success) {
          setActionItems(taskRes.value.data.actionItems || []);
        }
      } catch (err) {
        console.warn('[AISummaryModal] Load warning:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchExisting();

    return () => {
      isMounted = false;
    };
  }, [isOpen, meetingId]);

  // Generate / Regenerate AI Summary
  const handleGenerate = async () => {
    if (!meetingId) {
      setError('Meeting identifier is missing. Please join the meeting first.');
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const [sumRes, taskRes] = await Promise.allSettled([
        aiService.generateSummary(meetingId),
        aiService.extractActionItems(meetingId),
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value.data.success) {
        setSummary(sumRes.value.data.summary);
      } else if (sumRes.status === 'rejected') {
        const msg =
          (sumRes.reason as any)?.response?.data?.message ||
          'Failed to generate summary. Ensure transcripts exist by speaking or loading demo data.';
        setError(msg);
      }

      if (taskRes.status === 'fulfilled' && taskRes.value.data.success) {
        setActionItems(taskRes.value.data.actionItems || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate AI summary');
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="flex flex-col w-full h-[92vh] sm:h-[85vh] sm:max-w-2xl rounded-t-3xl sm:rounded-3xl border border-slate-800 bg-slate-900 text-white shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 sm:px-6 sm:py-4 shrink-0 bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">AI Meeting Intelligence</h3>
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30">
                  Live Suite
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                {meetingTitle || 'Meeting Session'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher if summary exists */}
        {summary && (
          <div className="flex items-center gap-2 border-b border-slate-800 px-4 pt-2 shrink-0 bg-slate-950/40">
            <button
              onClick={() => setActiveTab('summary')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'summary'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Summary & Decisions
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'tasks'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Action Items</span>
              {actionItems.length > 0 && (
                <span className="rounded-full bg-indigo-500/30 px-1.5 py-0.2 text-[10px] text-indigo-300">
                  {actionItems.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Main Body Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3.5 text-xs text-red-300 space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                <span>Notice</span>
              </div>
              <p className="text-[11px] text-red-200/90 leading-relaxed">{error}</p>
              {onOpenTranscript && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTranscript();
                  }}
                  className="mt-1 text-indigo-400 hover:text-indigo-300 underline font-medium text-[11px]"
                >
                  Open Live AI Transcript to speak or load demo data &rarr;
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <div className="h-9 w-9 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent mb-3" />
              <p className="text-xs text-slate-400">Loading meeting intelligence...</p>
            </div>
          ) : generating ? (
            <div className="flex h-64 flex-col items-center justify-center text-center space-y-3 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 animate-pulse">
                <Sparkles className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Generating AI Meeting Summary...</h4>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Analyzing speech transcript segments, extracting key discussion highlights, decisions, and action items.
              </p>
            </div>
          ) : summary ? (
            activeTab === 'summary' ? (
              <div className="space-y-4">
                {/* Executive Overview */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Executive Overview
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                    {summary.overview}
                  </p>
                </div>

                {/* Key Discussion Points */}
                {summary.discussionPoints && summary.discussionPoints.length > 0 && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2.5">
                      Key Discussion Points
                    </h4>
                    <ul className="space-y-2">
                      {summary.discussionPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                          <span className="leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Key Decisions */}
                {summary.keyDecisions && summary.keyDecisions.length > 0 && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2.5 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Key Decisions Made
                    </h4>
                    <ul className="space-y-2">
                      {summary.keyDecisions.map((dec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-emerald-200/90">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{dec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next Steps */}
                {summary.nextSteps && summary.nextSteps.length > 0 && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2 flex items-center gap-1.5">
                      <ListChecks className="h-3.5 w-3.5" /> Next Steps & Direction
                    </h4>
                    <ul className="space-y-2">
                      {summary.nextSteps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <ArrowRight className="h-3 w-3 text-purple-400 shrink-0 mt-1" />
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Questions & Risks if any */}
                {summary.risksAndIssues && summary.risksAndIssues.length > 0 && (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-950/10 p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" /> Risks & Open Questions
                    </h4>
                    <ul className="space-y-1.5">
                      {summary.risksAndIssues.map((risk, idx) => (
                        <li key={idx} className="text-xs text-amber-200/90 flex items-start gap-2">
                          <span className="mt-1.5 h-1 w-1 rounded-full bg-amber-400 shrink-0" />
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>Model: {summary.modelUsed || 'OpenAI GPT-4o'}</span>
                  <span>Generated: {new Date(summary.generatedAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ) : (
              /* Action Items Tab */
              <div className="space-y-3">
                {actionItems.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No action items extracted yet. Click "Regenerate" below to analyze transcript.
                  </div>
                ) : (
                  actionItems.map((item, idx) => (
                    <div
                      key={item._id || item.id || idx}
                      className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 flex items-start gap-3"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                        <ListChecks className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-xs font-semibold text-white truncate">{item.title}</h5>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                              item.status === 'Completed'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-400">
                          {item.assignee && <span>Assignee: {item.assignee}</span>}
                          {item.dueDate && <span>Due: {item.dueDate}</span>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )
          ) : (
            /* No summary generated yet state */
            <div className="flex h-72 flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="h-7 w-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">No Summary Generated Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                  Generate an instant AI Executive Summary from live conversation transcripts.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 active:scale-98 transition-all"
              >
                <Sparkles className="h-4 w-4" />
                <span>Generate Summary with AI</span>
              </button>

              {onOpenTranscript && (
                <p className="text-[11px] text-slate-400">
                  Tip: Speak into the mic or{' '}
                  <button
                    onClick={() => {
                      onClose();
                      onOpenTranscript();
                    }}
                    className="text-indigo-400 hover:underline"
                  >
                    load demo transcript
                  </button>{' '}
                  first.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {summary && (
          <div className="border-t border-slate-800 p-3 sm:p-4 bg-slate-900/95 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 active:scale-95 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Analyzing...' : 'Regenerate'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Back to Meeting
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
