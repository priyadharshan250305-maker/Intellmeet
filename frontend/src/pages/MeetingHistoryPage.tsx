import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { meetingService } from '../services';
import { Meeting } from '../types';
import {
  History,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Search,
  Video,
  FileText,
} from 'lucide-react';

export const MeetingHistoryPage: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    meetingService
      .getMeetingHistory()
      .then((res) => {
        if (res.data.success) {
          setMeetings(res.data.meetings || []);
        }
      })
      .catch((err) => console.warn('[MeetingHistory] Fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredMeetings = meetings.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.roomId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl flex items-center gap-2.5">
            <History className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Meeting History & Recordings</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Review past sessions, access full transcripts, and view AI-generated summaries.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search meetings or Room ID..."
            className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading meeting history...</div>
      ) : filteredMeetings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <History className="mx-auto h-12 w-12 text-slate-400 opacity-40 mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No meeting records found
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {searchQuery
              ? 'No meetings match your search query.'
              : 'Completed meetings will automatically appear here with generated AI summaries.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMeetings.map((meeting) => (
            <div
              key={meeting._id || meeting.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md dark:border-slate-800 dark:bg-slate-900 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {meeting.title}
                  </h3>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {meeting.roomId}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {meeting.actualEndTime
                      ? new Date(meeting.actualEndTime).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Recently Completed'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Duration: {meeting.durationMinutes || 1} minutes
                  </span>
                  {meeting.workspaceId && (
                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {(meeting.workspaceId as any).name || 'Workspace'}
                    </span>
                  )}
                </div>

                {meeting.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-1">
                    {meeting.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  to={`/meeting/${meeting._id || meeting.id}`}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:opacity-95 transition-opacity"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI Summary & Actions</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
