import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services';
import {
  User,
  Shield,
  Briefcase,
  Building,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Video,
} from 'lucide-react';

export const ProfileSettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [title, setTitle] = useState(user?.title || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [stats, setStats] = useState<{ totalMeetingsHosted: number; activeWorkspaces: number }>({
    totalMeetingsHosted: 0,
    activeWorkspaces: 0,
  });

  useEffect(() => {
    userService
      .getProfile()
      .then((res) => {
        if (res.data.success) {
          setName(res.data.user.name);
          setTitle(res.data.user.title || '');
          setDepartment(res.data.user.department || '');
          setAvatar(res.data.user.avatar || '');
          if (res.data.stats) {
            setStats(res.data.stats);
          }
        }
      })
      .catch((e) => console.warn('[Profile] Load error:', e));
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    try {
      const res = await userService.updateProfile({ name, title, department, avatar });
      if (res.data.success) {
        updateUser(res.data.user);
        setProfileMsg({ type: 'success', text: 'Profile details saved successfully.' });
      }
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    try {
      const res = await userService.changePassword({ currentPassword, newPassword });
      if (res.data.success) {
        setPasswordMsg({ type: 'success', text: 'Password updated successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Password update failed' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Account Profile & Preferences
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your personal details, workspace identity, security, and appearance.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row items-center gap-6">
        <img
          src={
            avatar ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`
          }
          alt={user?.name}
          className="h-20 w-20 rounded-full object-cover border-2 border-indigo-500 shadow-md"
        />

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h2>
            {user?.role === 'admin' && (
              <span className="inline-flex items-center gap-1 rounded bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                <Shield className="h-3 w-3" /> System Admin
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {title || 'Team Member'} • {department || 'General'}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-6 dark:border-slate-800 w-full sm:w-auto justify-around sm:justify-start">
          <div className="text-center">
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">
              {stats.totalMeetingsHosted}
            </span>
            <p className="text-[10px] uppercase font-semibold text-slate-400">Meetings Hosted</p>
          </div>
          <div className="text-center">
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">
              {stats.activeWorkspaces}
            </span>
            <p className="text-[10px] uppercase font-semibold text-slate-400">Workspaces</p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Personal Information
        </h3>

        {profileMsg && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
              profileMsg.type === 'success'
                ? 'border border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                : 'border border-red-500/30 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
            }`}
          >
            {profileMsg.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span>{profileMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-transparent px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Job Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-transparent px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-transparent px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Avatar URL</label>
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-300 bg-transparent px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      {/* Password Change Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span>Change Password</span>
        </h3>

        {passwordMsg && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
              passwordMsg.type === 'success'
                ? 'border border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                : 'border border-red-500/30 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
            }`}
          >
            {passwordMsg.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-transparent px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full rounded-xl border border-slate-300 bg-transparent px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-transparent px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Appearance Theme */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Appearance Theme</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Switch between light and dark themes. Currently set to{' '}
            <span className="font-semibold capitalize">{theme} mode</span>.
          </p>
        </div>

        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span>Toggle Theme</span>
        </button>
      </div>
    </div>
  );
};
