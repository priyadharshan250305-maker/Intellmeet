import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { meetingService, workspaceService } from '../services';
import { Workspace } from '../types';
import {
  Video,
  Calendar,
  Lock,
  Globe,
  Settings,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

export const CreateMeetingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const isInstantParam = searchParams.get('instant') === 'true';
  const navigate = useNavigate();

  const [isInstant, setIsInstant] = useState(isInstantParam);
  const [title, setTitle] = useState(isInstantParam ? 'Instant Sync Session' : '');
  const [description, setDescription] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [scheduledStartTime, setScheduledStartTime] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [audioMutedOnEntry, setAudioMutedOnEntry] = useState(false);
  const [videoOffOnEntry, setVideoOffOnEntry] = useState(false);
  const [screenShareAllowed, setScreenShareAllowed] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(true);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    workspaceService
      .getUserWorkspaces()
      .then((res) => {
        if (res.data.success) {
          setWorkspaces(res.data.workspaces || []);
          if (res.data.workspaces?.length > 0) {
            setWorkspaceId(res.data.workspaces[0].id || (res.data.workspaces[0] as any)._id);
          }
        }
      })
      .catch((err) => console.warn('[CreateMeeting] Workspace load error:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a meeting title');
      return;
    }

    if (!isInstant && !scheduledStartTime) {
      setError('Please select a scheduled start time');
      return;
    }

    try {
      setLoading(true);
      const res = await meetingService.createMeeting({
        title: title.trim(),
        description: description.trim(),
        workspaceId: workspaceId || undefined,
        scheduledStartTime: isInstant ? undefined : scheduledStartTime,
        isPrivate,
        passcode: isPrivate ? passcode : undefined,
        settings: {
          audioMutedOnEntry,
          videoOffOnEntry,
          screenShareAllowed,
          chatEnabled,
        },
      });

      if (res.data.success && res.data.meeting) {
        const roomId = res.data.meeting.roomId;
        if (isInstant) {
          // Immediately redirect to room
          navigate(`/room/${roomId}`);
        } else {
          // Redirect to meeting history / dashboard
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {isInstant ? 'Start Instant Meeting' : 'Schedule New Meeting'}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Configure video conference room, security passcodes, and AI transcription settings.
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80 max-w-sm">
        <button
          type="button"
          onClick={() => {
            setIsInstant(true);
            if (!title) setTitle('Instant Sync Session');
          }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
            isInstant
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Video className="h-4 w-4" /> Instant Meeting
        </button>
        <button
          type="button"
          onClick={() => {
            setIsInstant(false);
            if (title === 'Instant Sync Session') setTitle('');
          }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
            !isInstant
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Calendar className="h-4 w-4" /> Schedule Ahead
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-50 p-4 text-xs font-medium text-red-700 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Configuration Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Meeting Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Q3 Sprint Planning & Architecture Review"
            className="w-full rounded-xl border border-slate-300 bg-transparent px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description / Agenda
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key discussion points, agenda items, or objectives..."
            className="w-full rounded-xl border border-slate-300 bg-transparent px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:text-white"
          />
        </div>

        {/* Schedule Time (if not instant) */}
        {!isInstant && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Scheduled Date & Time *
            </label>
            <input
              type="datetime-local"
              required={!isInstant}
              value={scheduledStartTime}
              onChange={(e) => setScheduledStartTime(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-transparent px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:text-white"
            />
          </div>
        )}

        {/* Workspace Selection */}
        {workspaces.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Associate with Team Workspace
            </label>
            <select
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-transparent px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:text-white dark:bg-slate-900"
            >
              <option value="">None (Personal Meeting)</option>
              {workspaces.map((ws) => (
                <option key={ws.id || (ws as any)._id} value={ws.id || (ws as any)._id}>
                  {ws.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Security & Access Controls */}
        <div className="border-t border-slate-100 pt-5 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Security & Access Controls</span>
          </h3>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Private Meeting Protection
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Require participants to provide a 4-digit passcode before joining.
              </p>
            </div>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </div>

          {isPrivate && (
            <div className="pl-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Room Passcode
              </label>
              <input
                type="text"
                required={isPrivate}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="e.g. 5421"
                maxLength={8}
                className="w-48 rounded-xl border border-slate-300 bg-transparent px-3.5 py-2 text-sm text-slate-900 font-mono focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Entry Defaults */}
        <div className="border-t border-slate-100 pt-5 dark:border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Entry & Feature Preferences</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-3 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <input
                type="checkbox"
                checked={audioMutedOnEntry}
                onChange={(e) => setAudioMutedOnEntry(e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                Mute microphones upon entry
              </span>
            </label>

            <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-3 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <input
                type="checkbox"
                checked={videoOffOnEntry}
                onChange={(e) => setVideoOffOnEntry(e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                Turn off camera upon entry
              </span>
            </label>

            <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-3 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <input
                type="checkbox"
                checked={screenShareAllowed}
                onChange={(e) => setScreenShareAllowed(e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                Allow screen sharing
              </span>
            </label>

            <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-3 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <input
                type="checkbox"
                checked={chatEnabled}
                onChange={(e) => setChatEnabled(e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                Enable in-meeting live chat
              </span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>{isInstant ? 'Launch Meeting Now' : 'Schedule Meeting'}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
