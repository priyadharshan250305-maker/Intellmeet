import React from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  Sparkles,
  Users,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Zap,
  Globe2,
  Lock,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),theme(colors.slate.50))] dark:bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.950),theme(colors.slate.950))] opacity-50" />
        
        <div className="mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 mb-8 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
            <span>Introducing IntellMeet 2.0 with Real-Time OpenAI Summaries</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-7xl">
            Intelligent Enterprise Meetings,{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent">
              Powered by AI
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Ultra-low latency WebRTC video conferencing with automated speech-to-text transcription,
            instant executive meeting summaries, and actionable task extraction in unified team workspaces.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all hover:scale-105"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/schedule?instant=true"
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-all"
            >
              <Video className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Launch Instant Meeting</span>
            </Link>
          </div>

          {/* Interactive Feature Highlights */}
          <div className="mt-16 grid grid-cols-2 gap-4 text-left sm:grid-cols-4 lg:max-w-4xl lg:mx-auto">
            {[
              { title: 'Zero Latency', desc: 'Direct WebRTC mesh P2P' },
              { title: 'AI Summaries', desc: 'Decisions & next steps' },
              { title: 'Action Items', desc: 'Auto-extracted task lists' },
              { title: 'Enterprise RBAC', desc: 'Workspaces & passcodes' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">{item.title}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="border-t border-slate-200 bg-white py-20 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Everything Your Organization Needs
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Built from the ground up for modern hybrid engineering and executive teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-slate-200 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950/50 hover:border-indigo-500/50 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-6">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                WebRTC Video & Screen Share
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Crisp audio and video streaming with intelligent camera/microphone controls, multi-user grid tiles, and high-definition screen sharing.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950/50 hover:border-indigo-500/50 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-6">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                AI Summaries & Action Items
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Transform live conversations into structured summaries, key decisions, and prioritized tasks with clear assignees and due dates.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950/50 hover:border-indigo-500/50 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-6">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Team Workspaces & RBAC
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Organize projects by workspace with role-based permissions (Owner, Admin, Member), shared collaborative notes, and task lists.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Reliability Banner */}
      <section className="py-16 bg-slate-900 text-white border-t border-slate-800">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Lock className="h-3.5 w-3.5" /> Enterprise Grade
            </div>
            <h3 className="text-2xl font-bold">Secure by Design</h3>
            <p className="mt-2 text-sm text-slate-400 max-w-xl">
              Equipped with bcrypt password hashing, JWT sessions, strict room privacy passcodes, STUN/TURN fallback traversal, and granular admin controls.
            </p>
          </div>
          <Link
            to="/signup"
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors shrink-0"
          >
            Create Your Workspace
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} IntellMeet Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              Sign In
            </Link>
            <Link to="/signup" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              Register
            </Link>
            <span className="text-slate-400">WebRTC & Socket.IO Powered</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
