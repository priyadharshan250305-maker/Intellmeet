import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarPlus,
  History,
  Briefcase,
  UserCheck,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Create & Schedule', path: '/schedule', icon: CalendarPlus },
    { name: 'Meeting History', path: '/history', icon: History },
    { name: 'Workspaces', path: '/workspaces', icon: Briefcase },
    { name: 'Profile & Settings', path: '/profile', icon: UserCheck },
  ];

  if (user?.role === 'admin') {
    navItems.push({ name: 'Admin Console', path: '/admin', icon: ShieldAlert });
  }

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="flex-1 space-y-1.5 p-4 overflow-y-auto">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider dark:text-slate-500">
          Collaboration
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* AI Superpowers Banner Card */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-indigo-500/5 p-4 border border-indigo-200/50 dark:border-indigo-900/50">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs mb-1">
            <Sparkles className="h-4 w-4" />
            <span>AI Powered</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Real-time transcription, summaries & action item extraction enabled.
          </p>
        </div>
      </div>
    </aside>
  );
};
