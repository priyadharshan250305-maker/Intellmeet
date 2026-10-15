import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { meetingService, workspaceService } from '../services';
import { Meeting, Workspace } from '../types';
import {
  Video,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Play,
  FileText,
  Users,
  CheckCircle,
  Briefcase,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [meetingsRes, workspacesRes] = await Promise.all([
          meetingService.getUserMeetings(),
          workspaceService.getUserWorkspaces(),
        ]);

        if (meetingsRes.data.success) {
          setUpcomingMeetings(meetingsRes.data.upcoming || []);
          setRecentMeetings(meetingsRes.data.history || []);
        }

        if (workspacesRes.data.success) {
          setWorkspaces(workspacesRes.data.workspaces || []);
        }
      } catch (err: any) {
        console.warn('[Dashboard] Data fetch warning:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleJoinByRoomId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomId.trim()) return;
    navigate(`/room/${joinRoomId.trim()}`);
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-8 text-white shadow-xl shadow-indigo-600/15 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md mb-3">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>AI Workspace Active</span>
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Welcome back, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="mt-2 text-indigo-100 text-sm max-w-xl leading-relaxed">
            Ready to collaborate? Launch an instant video conference or schedule an upcoming sync with automatic AI meeting notes.
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/schedule?instant=true"
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 shadow-md hover:bg-indigo-50 transition-all hover:scale-105 shrink-0"
          >
            <Play className="h-4 w-4 fill-indigo-700" />
            <span>New Instant Meeting</span>
          </Link>

          <Link
            to="/schedule"
            className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 backdrop-blur-md px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all shrink-0"
          >
            <Calendar className="h-4 w-4" />
            <span>Schedule Meeting</span>
          </Link>
        </div>
      </div>

      {/* Quick Join Card & Stat Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Join by Room ID */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Video className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Join with Room ID</span>
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Have a meeting code or invitation link? Enter it here to join directly.
            </p>
          </div>

          <form onSubmit={handleJoinByRoomId} className="mt-4 flex gap-2">
            <input
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              placeholder="e.g. 7f3b-82a1-9c04"
              className="flex-1 rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:text-white uppercase font-mono"
            />
            <button
              type="submit"
              disabled={!joinRoomId.trim()}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors"
            >
              Join
            </button>
          </form>
        </div>

        {/* Total Meetings Hosted Stat */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 shrink-0">
            <Video className="h-7 w-7" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {recentMeetings.length + upcomingMeetings.length}
            </span>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
              Total Meetings
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Across all workspace channels</p>
          </div>
        </div>

        {/* Active Workspaces Stat */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 shrink-0">
            <Briefcase className="h-7 w-7" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {workspaces.length}
            </span>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
              Active Workspaces
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Personal & enterprise teams</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Upcoming Meetings & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming & Live Meetings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Upcoming & Live Meetings
              </h2>
            </div>
            <Link
              to="/schedule"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Schedule New
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading schedule...</div>
          ) : upcomingMeetings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
              <Calendar className="mx-auto h-8 w-8 text-slate-400 opacity-60 mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No upcoming meetings scheduled
              </p>
              <p className="text-xs text-slate-500 mt-1">
                You're all caught up! Create a new meeting to collaborate.
              </p>
              <Link
                to="/schedule"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300"
              >
                Schedule Now
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingMeetings.map((m) => (
                <div
                  key={m._id || m.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-4 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {m.title}
                      </h4>
                      {m.status === 'live' && (
                        <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-950 dark:text-red-300 animate-pulse">
                          ● LIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {m.scheduledStartTime
                          ? new Date(m.scheduledStartTime).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Instant Room'}
                      </span>
                      <span>• Room: {m.roomId}</span>
                    </p>
                  </div>

                  <Link
                    to={`/room/${m.roomId}`}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all shrink-0"
                  >
                    <span>Join Room</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Meetings with AI Summary Links */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Sessions & AI Insights
              </h2>
            </div>
            <Link
              to="/history"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              View Full History →
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading history...</div>
          ) : recentMeetings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
              <FileText className="mx-auto h-8 w-8 text-slate-400 opacity-60 mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No completed meetings yet
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Completed meetings and their AI summaries will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMeetings.slice(0, 5).map((m) => (
                <div
                  key={m._id || m.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-4 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 transition-colors"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {m.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Duration: {m.durationMinutes || 1} min • Ended{' '}
                      {m.actualEndTime
                        ? new Date(m.actualEndTime).toLocaleDateString()
                        : 'Recently'}
                    </p>
                  </div>

                  <Link
                    to={`/meeting/${m._id || m.id}`}
                    className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-900 dark:bg-purple-950/60 dark:text-purple-300 transition-colors shrink-0"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI Summary</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
