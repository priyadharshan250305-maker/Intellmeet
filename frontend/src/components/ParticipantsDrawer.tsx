import React, { useState } from 'react';
import { PeerState } from '../types';
import {
  Users,
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  Maximize2,
  Pin,
  Shield,
  Search,
} from 'lucide-react';

interface ParticipantsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id?: string; name: string; avatar?: string; role?: string };
  peers: PeerState[];
  isLocalMuted?: boolean;
  isLocalVideoOff?: boolean;
  isLocalHandRaised?: boolean;
  isLocalScreenSharing?: boolean;
  pinnedSocketId?: string | null;
  onTogglePin?: (socketId: string) => void;
}

export const ParticipantsDrawer: React.FC<ParticipantsDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  peers,
  isLocalMuted = false,
  isLocalVideoOff = false,
  isLocalHandRaised = false,
  isLocalScreenSharing = false,
  pinnedSocketId,
  onTogglePin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const totalCount = 1 + peers.length;

  // Filter peers by search query if user searches
  const filteredPeers = peers.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );
  const showLocal =
    !searchQuery.trim() ||
    currentUser.name.toLowerCase().includes(searchQuery.trim().toLowerCase());

  return (
    <div className="fixed inset-0 z-40 w-full sm:w-96 md:relative md:inset-auto md:w-80 lg:w-96 flex flex-col border-l border-slate-800 bg-slate-900 h-full text-slate-100 shrink-0 shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Participants</span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-indigo-400 border border-slate-700">
                {totalCount}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Active participants in this call</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Optional Search Bar when many participants */}
      {totalCount > 3 && (
        <div className="p-3 border-b border-slate-800 bg-slate-950/40">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search participants..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Participant List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Local Participant (You) */}
        {showLocal && (
          <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-3 truncate pr-2">
              <div className="relative shrink-0">
                <img
                  src={
                    currentUser.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      currentUser.name
                    )}`
                  }
                  alt={currentUser.name}
                  className="h-9 w-9 rounded-full object-cover border border-slate-700 bg-slate-800"
                />
                {isLocalHandRaised && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow-sm animate-bounce">
                    <Hand className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white truncate">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 shrink-0">
                    (You)
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {currentUser.role === 'host' && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-indigo-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-indigo-300 border border-indigo-500/30">
                      <Shield className="h-2.5 w-2.5" /> Host
                    </span>
                  )}
                  {isLocalScreenSharing && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-blue-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-blue-300">
                      <Maximize2 className="h-2.5 w-2.5" /> Sharing
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Local Status Icons */}
            <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
              <div
                title={isLocalMuted ? 'Muted' : 'Microphone Active'}
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  isLocalMuted ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {isLocalMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              </div>
              <div
                title={isLocalVideoOff ? 'Camera Off' : 'Camera Active'}
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  isLocalVideoOff ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {isLocalVideoOff ? (
                  <VideoOff className="h-3.5 w-3.5" />
                ) : (
                  <Video className="h-3.5 w-3.5" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Remote Peers List */}
        {filteredPeers.map((peer) => {
          const isPinned = pinnedSocketId === peer.socketId;

          return (
            <div
              key={peer.socketId}
              className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3 truncate pr-2">
                <div className="relative shrink-0">
                  <img
                    src={
                      peer.avatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(peer.name)}`
                    }
                    alt={peer.name}
                    className="h-9 w-9 rounded-full object-cover border border-slate-700 bg-slate-800"
                  />
                  {peer.isHandRaised && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow-sm animate-bounce">
                      <Hand className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-200 truncate">{peer.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {peer.role === 'host' && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-indigo-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-indigo-300 border border-indigo-500/30">
                        <Shield className="h-2.5 w-2.5" /> Host
                      </span>
                    )}
                    {peer.isSharingScreen && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-blue-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-blue-300">
                        <Maximize2 className="h-2.5 w-2.5" /> Sharing
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Remote Status Icons & Pin Button */}
              <div className="flex items-center gap-1 shrink-0">
                {onTogglePin && (
                  <button
                    onClick={() => onTogglePin(peer.socketId)}
                    title={isPinned ? 'Unpin participant' : 'Pin participant'}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                      isPinned
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </button>
                )}

                <div
                  title={peer.isMuted ? 'Muted' : 'Microphone Active'}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    peer.isMuted ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {peer.isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                </div>

                <div
                  title={peer.isVideoOff ? 'Camera Off' : 'Camera Active'}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    peer.isVideoOff ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {peer.isVideoOff ? (
                    <VideoOff className="h-3.5 w-3.5" />
                  ) : (
                    <Video className="h-3.5 w-3.5" />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredPeers.length === 0 && !showLocal && (
          <div className="py-8 text-center text-xs text-slate-500">
            No participants found matching "{searchQuery}".
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t border-slate-800 p-3 text-center text-[11px] text-slate-400">
        Participants join and stream in real time via WebRTC.
      </div>
    </div>
  );
};
