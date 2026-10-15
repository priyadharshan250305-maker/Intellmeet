import React, { useState, useEffect } from 'react';
import { workspaceService, meetingService } from '../services';
import { Workspace, WorkspaceMembership, Meeting, ActionItem } from '../types';
import {
  Briefcase,
  Users,
  UserPlus,
  FileText,
  CheckSquare,
  Plus,
  Trash2,
  Shield,
  Save,
  Clock,
  Calendar,
  AlertCircle,
  Video,
} from 'lucide-react';

export const WorkspacePage: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  const [workspaceDetails, setWorkspaceDetails] = useState<any | null>(null);
  const [members, setMembers] = useState<WorkspaceMembership[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<ActionItem[]>([]);
  const [sharedNotes, setSharedNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');

  const [loading, setLoading] = useState(true);

  // Fetch all user workspaces
  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const res = await workspaceService.getUserWorkspaces();
      if (res.data.success) {
        const wsList = res.data.workspaces || [];
        setWorkspaces(wsList);
        if (wsList.length > 0 && !activeWorkspaceId) {
          setActiveWorkspaceId(wsList[0].id || (wsList[0] as any)._id);
        }
      }
    } catch (e) {
      console.warn('[Workspace] Load error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch active workspace details
  useEffect(() => {
    if (!activeWorkspaceId) return;

    workspaceService
      .getWorkspaceDetails(activeWorkspaceId)
      .then((res) => {
        if (res.data.success) {
          setWorkspaceDetails(res.data.workspace);
          setMembers(res.data.members || []);
          setRecentMeetings(res.data.recentMeetings || []);
          setTasks(res.data.tasks || []);
          setSharedNotes(res.data.workspace?.sharedNotes || '');
        }
      })
      .catch((e) => console.warn('[Workspace] Details fetch error:', e));
  }, [activeWorkspaceId]);

  // Save collaborative shared notes
  const handleSaveNotes = async () => {
    if (!activeWorkspaceId) return;
    try {
      setSavingNotes(true);
      await workspaceService.updateNotes(activeWorkspaceId, sharedNotes);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  // Create Workspace
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    try {
      const res = await workspaceService.createWorkspace({
        name: newWsName.trim(),
        description: newWsDesc.trim(),
      });

      if (res.data.success) {
        setShowCreateModal(false);
        setNewWsName('');
        setNewWsDesc('');
        loadWorkspaces();
        setActiveWorkspaceId(res.data.workspace.id || (res.data.workspace as any)._id);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create workspace');
    }
  };

  // Invite Member
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId || !inviteEmail.trim()) return;

    try {
      const res = await workspaceService.inviteMember(activeWorkspaceId, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      if (res.data.success) {
        setShowInviteModal(false);
        setInviteEmail('');
        setMembers((prev) => [...prev, res.data.membership]);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Invitation failed');
    }
  };

  // Remove Member
  const handleRemoveMember = async (memberId: string) => {
    if (!activeWorkspaceId) return;
    if (window.confirm('Remove this member from the workspace?')) {
      try {
        await workspaceService.removeMember(activeWorkspaceId, memberId);
        setMembers((prev) => prev.filter((m) => m._id !== memberId));
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to remove member');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Page Title & Workspace Selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl flex items-center gap-2.5">
            <Briefcase className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Team Workspaces</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Collaborative team hubs with member management, shared meeting notes, and action tracking.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Workspace</span>
        </button>
      </div>

      {/* Workspace Switcher Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {workspaces.map((ws) => {
          const wsId = ws.id || (ws as any)._id;
          const isActive = activeWorkspaceId === wsId;
          return (
            <button
              key={wsId}
              onClick={() => setActiveWorkspaceId(wsId)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all shrink-0 border ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800'
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>{ws.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Layout */}
      {workspaceDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Shared Collaborative Notes & Tasks (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shared Notes Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Workspace Shared Notes
                  </h3>
                </div>
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{savingNotes ? 'Saving...' : 'Save Notes'}</span>
                </button>
              </div>

              <textarea
                rows={6}
                value={sharedNotes}
                onChange={(e) => setSharedNotes(e.target.value)}
                placeholder="Team sprint goals, architecture decisions, meeting guidelines, or ongoing sync notes..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs font-normal text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-200"
              />
            </div>

            {/* Workspace Action Items / Tasks */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Workspace Action Items ({tasks.length})
                  </h3>
                </div>
              </div>

              {tasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No action items linked to this workspace yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tasks.map((task) => (
                    <div
                      key={task._id || task.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <h5
                          className={`text-xs font-semibold text-slate-900 dark:text-white ${
                            task.status === 'Completed' ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {task.title}
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {task.assignee ? `Assignee: ${task.assignee}` : 'Unassigned'} • Status:{' '}
                          {task.status}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          task.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Workspace Meetings */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 mb-4">
                <Video className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Workspace Meeting Sessions
                </h3>
              </div>

              {recentMeetings.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No meetings have been hosted in this workspace yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentMeetings.map((m) => (
                    <div
                      key={m._id || m.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-slate-800"
                    >
                      <div>
                        <h5 className="text-xs font-semibold text-slate-900 dark:text-white">
                          {m.title}
                        </h5>
                        <p className="text-[11px] text-slate-500">
                          Room: {m.roomId} • Status: {m.status}
                        </p>
                      </div>
                      <a
                        href={`/meeting/${m._id || m.id}`}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        View Notes →
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Member List & RBAC Management (1 col) */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Members ({members.length})
                  </h3>
                </div>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 transition-colors"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Invite
                </button>
              </div>

              <div className="space-y-3">
                {members.map((member) => {
                  const mUser = member.userId;
                  const displayName = mUser?.name || member.invitedEmail.split('@')[0];
                  return (
                    <div
                      key={member._id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            mUser?.avatar ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                              displayName
                            )}`
                          }
                          alt={displayName}
                          className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {displayName}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {member.invitedEmail}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            member.role === 'owner'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : member.role === 'admin'
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {member.role}
                        </span>

                        {member.role !== 'owner' && (
                          <button
                            onClick={() => handleRemoveMember(member._id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            title="Remove member"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white">
            <h3 className="text-base font-bold mb-4">Create New Team Workspace</h3>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Workspace Name *</label>
                <input
                  type="text"
                  required
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. Core Engineering Platform"
                  className="w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  placeholder="Shared focus area, goals, or mission..."
                  className="w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md"
                >
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white">
            <h3 className="text-base font-bold mb-4">Invite Team Member</h3>
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Workspace Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="member">Member</option>
                  <option value="admin">Workspace Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
