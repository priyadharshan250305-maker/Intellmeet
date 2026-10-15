import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { aiService, transcriptService, meetingService } from '../services';
import {
  MeetingSummary,
  ActionItem,
  TranscriptSegment,
  Meeting,
} from '../types';
import {
  Sparkles,
  CheckSquare,
  FileText,
  Clock,
  Calendar,
  AlertTriangle,
  HelpCircle,
  CheckCircle,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Video,
  ArrowLeft,
  User,
  Shield,
  Layers,
} from 'lucide-react';

export const MeetingDetailsPage: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();

  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [activeTab, setActiveTab] = useState<'summary' | 'actionItems' | 'transcript'>('summary');

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // New action item modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  useEffect(() => {
    if (!meetingId) return;

    const loadData = async () => {
      try {
        const [sumRes, tasksRes, transRes] = await Promise.allSettled([
          aiService.getSummary(meetingId),
          aiService.getActionItems(meetingId),
          transcriptService.getTranscript(meetingId),
        ]);

        if (sumRes.status === 'fulfilled' && sumRes.value.data.success) {
          setSummary(sumRes.value.data.summary);
        }
        if (tasksRes.status === 'fulfilled' && tasksRes.value.data.success) {
          setActionItems(tasksRes.value.data.actionItems || []);
        }
        if (transRes.status === 'fulfilled' && transRes.value.data.success) {
          setTranscript(transRes.value.data.segments || []);
        }
      } catch (e) {
        console.warn('[MeetingDetails] Initial load error:', e);
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, [meetingId]);

  // Generate / Regenerate Summary
  const handleGenerateSummary = async () => {
    if (!meetingId) return;
    try {
      setLoadingSummary(true);
      const res = await aiService.generateSummary(meetingId);
      if (res.data.success) {
        setSummary(res.data.summary);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate AI summary');
    } finally {
      setLoadingSummary(false);
    }
  };

  // Extract Action Items via AI
  const handleExtractActionItems = async () => {
    if (!meetingId) return;
    try {
      setLoadingTasks(true);
      const res = await aiService.extractActionItems(meetingId);
      if (res.data.success) {
        setActionItems(res.data.actionItems || []);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to extract action items');
    } finally {
      setLoadingTasks(false);
    }
  };

  // Update Action Item Status
  const handleUpdateStatus = async (
    id: string,
    newStatus: 'Pending' | 'In Progress' | 'Completed'
  ) => {
    try {
      const res = await aiService.updateActionItem(id, { status: newStatus });
      if (res.data.success) {
        setActionItems((prev) =>
          prev.map((item) => (item._id === id || item.id === id ? res.data.actionItem : item))
        );
      }
    } catch (err: any) {
      console.warn('Status update error:', err);
    }
  };

  // Delete Action Item
  const handleDeleteTask = async (id: string) => {
    try {
      await aiService.deleteActionItem(id);
      setActionItems((prev) => prev.filter((item) => item._id !== id && item.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  // Add Manual Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingId || !newTitle.trim()) return;

    try {
      const res = await aiService.createActionItem({
        meetingId,
        title: newTitle.trim(),
        description: newDesc.trim(),
        assignee: newAssignee.trim() || undefined,
        dueDate: newDueDate || undefined,
        status: 'Pending',
      });

      if (res.data.success) {
        setActionItems((prev) => [res.data.actionItem, ...prev]);
        setShowTaskModal(false);
        setNewTitle('');
        setNewDesc('');
        setNewAssignee('');
        setNewDueDate('');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create action item');
    }
  };

  if (initialLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Top Breadcrumb & Back */}
      <div className="flex items-center justify-between">
        <Link
          to="/history"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to History
        </Link>
        <span className="text-xs text-slate-400 font-mono">Meeting ID: {meetingId}</span>
      </div>

      {/* Hero Header with Actions */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-indigo-900/50">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-lg bg-indigo-500/20 px-2.5 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> AI Intelligence Suite
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Meeting Intelligence & Summary
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-xl">
            Automated analysis generated from speech-to-text transcripts with extracted action items and decisions.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleGenerateSummary}
            disabled={loadingSummary}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingSummary ? 'animate-spin' : ''}`} />
            <span>{summary ? 'Regenerate Summary' : 'Generate AI Summary'}</span>
          </button>

          <button
            onClick={handleExtractActionItems}
            disabled={loadingTasks}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-purple-500 disabled:opacity-50 transition-all"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Extract Action Items</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('summary')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'summary'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Executive Summary</span>
        </button>

        <button
          onClick={() => setActiveTab('actionItems')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'actionItems'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          <span>Smart Action Items ({actionItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('transcript')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'transcript'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Full Transcript ({transcript.length} segments)</span>
        </button>
      </div>

      {/* Tab 1: AI Summary Content */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {!summary ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <Sparkles className="mx-auto h-12 w-12 text-indigo-500 opacity-40 mb-3" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                Summary Not Generated Yet
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Click "Generate AI Summary" above to process the meeting transcript into key decisions, risks, questions, and next steps.
              </p>
              <button
                onClick={handleGenerateSummary}
                disabled={loadingSummary}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500"
              >
                <Sparkles className="h-4 w-4" />
                <span>Generate Summary Now</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Executive Overview (Full Width) */}
              <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Meeting Overview</span>
                  </h3>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Model: {summary.modelUsed}
                  </span>
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                  {summary.overview}
                </p>
              </div>

              {/* Discussion Points */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-3">
                  <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Main Discussion Points</span>
                </h3>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {summary.discussionPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Decisions */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-3">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Key Decisions Agreed</span>
                </h3>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {summary.keyDecisions.map((dec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{dec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Important Questions */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-3">
                  <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Important Questions Raised</span>
                </h3>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {summary.importantQuestions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risks & Unresolved Issues */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>Risks & Unresolved Issues</span>
                </h3>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {summary.risksAndIssues.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Steps */}
              <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span>Next Steps & Immediate Follow-ups</span>
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-300">
                  {summary.nextSteps.map((step, i) => (
                    <li
                      key={i}
                      className="rounded-xl border border-slate-100 p-3 dark:border-slate-800 flex items-start gap-2"
                    >
                      <span className="h-2 w-2 rounded-full bg-purple-500 mt-1 shrink-0" />
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Smart Action Items */}
      {activeTab === 'actionItems' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tasks extracted by AI or added manually. Edit assignees, deadlines, and status as work progresses.
            </p>
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Custom Task</span>
            </button>
          </div>

          {actionItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <CheckSquare className="mx-auto h-12 w-12 text-purple-500 opacity-40 mb-3" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                No Action Items Logged
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Extract tasks from the meeting transcript or create items manually.
              </p>
              <button
                onClick={handleExtractActionItems}
                disabled={loadingTasks}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500"
              >
                <Sparkles className="h-3.5 w-3.5" /> Extract with AI
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {actionItems.map((task) => (
                <div
                  key={task._id || task.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5">
                      <h4
                        className={`text-sm font-semibold text-slate-900 dark:text-white ${
                          task.status === 'Completed' ? 'line-through text-slate-400 dark:text-slate-500' : ''
                        }`}
                      >
                        {task.title}
                      </h4>
                      {task.isAiGenerated && (
                        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          AI Extracted
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      {task.assignee ? (
                        <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                          <User className="h-3 w-3" /> Assignee: {task.assignee}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No assignee specified</span>
                      )}

                      {task.dueDate ? (
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <Calendar className="h-3 w-3" /> Due:{' '}
                          {new Date(task.dueDate).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No deadline specified</span>
                      )}
                    </div>
                  </div>

                  {/* Status Dropdown & Delete */}
                  <div className="flex items-center gap-3 shrink-0">
                    <select
                      value={task.status}
                      onChange={(e) =>
                        handleUpdateStatus(
                          (task._id || task.id)!,
                          e.target.value as any
                        )
                      }
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold border ${
                        task.status === 'Completed'
                          ? 'border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : task.status === 'In Progress'
                          ? 'border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                          : 'border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>

                    <button
                      onClick={() => handleDeleteTask((task._id || task.id)!)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Full Transcript Playback */}
      {activeTab === 'transcript' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Chronological Dialogue Transcript
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Speaker-attributed speech segments captured during the live meeting.
              </p>
            </div>
          </div>

          {transcript.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No transcript segments stored for this meeting.
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {transcript.map((seg, i) => (
                <div
                  key={seg._id || seg.id || i}
                  className="rounded-xl border border-slate-100 p-3.5 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {seg.speakerName}
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {seg.startTime}s - {seg.endTime}s
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
                    {seg.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual Task Create Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white">
            <h3 className="text-base font-bold mb-4">Add Meeting Action Item</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Prepare benchmark results for staging"
                  className="w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Context or acceptance criteria..."
                  className="w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Assignee</label>
                  <input
                    type="text"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
