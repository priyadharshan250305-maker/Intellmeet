import React, { useEffect, useRef } from 'react';
import { MicOff, Hand, Pin, Maximize2, Shield } from 'lucide-react';

interface VideoTileProps {
  stream?: MediaStream | null;
  name: string;
  avatar?: string;
  role?: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isSharingScreen?: boolean;
  isHandRaised?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

export const VideoTile: React.FC<VideoTileProps> = ({
  stream,
  name,
  avatar,
  role,
  isLocal = false,
  isMuted = false,
  isVideoOff = false,
  isSharingScreen = false,
  isHandRaised = false,
  isPinned = false,
  onTogglePin,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideoStream = stream && stream.getVideoTracks().some((t) => t.enabled && t.readyState === 'live');
  const showVideo = !isVideoOff && hasVideoStream;

  return (
    <div
      className={`relative group flex items-center justify-center overflow-hidden rounded-2xl bg-slate-900 border transition-all duration-200 ${
        isHandRaised ? 'ring-4 ring-amber-400' : ''
      } ${
        isPinned
          ? 'border-indigo-500 shadow-xl shadow-indigo-500/10'
          : 'border-slate-800 shadow-md'
      } h-full min-h-[220px] aspect-video w-full`}
    >
      {/* Actual HTML5 Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Always mute local video element to prevent echo feedback
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          showVideo ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
        } ${isLocal && !isSharingScreen ? 'scale-x-[-1]' : ''}`} // Mirror local camera preview unless screen sharing
      />

      {/* Avatar Fallback when video is off */}
      {!showVideo && (
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className="relative">
            <img
              src={
                avatar ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
              }
              alt={name}
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-slate-700 bg-slate-800 object-cover shadow-lg"
            />
            {isMuted && (
              <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow-md">
                <MicOff className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
          <span className="mt-3 text-sm font-semibold text-slate-200">{name}</span>
          {isLocal && (
            <span className="text-[11px] font-medium text-slate-400">(You)</span>
          )}
        </div>
      )}

      {/* Bottom overlay: Participant Name, Mute Icon & Role */}
      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2 rounded-lg bg-slate-950/70 backdrop-blur-md px-2.5 py-1 text-xs text-white border border-white/10 shadow-sm max-w-[85%] truncate">
        <span className="font-medium truncate">{name}</span>
        {isLocal && <span className="text-[10px] text-slate-400 shrink-0">(You)</span>}
        {role === 'host' && (
          <span className="flex items-center gap-1 rounded bg-indigo-500/30 px-1 py-0.5 text-[10px] text-indigo-300 shrink-0 font-medium">
            <Shield className="h-2.5 w-2.5" /> Host
          </span>
        )}
        {isMuted && <MicOff className="h-3.5 w-3.5 text-red-400 shrink-0" />}
      </div>

      {/* Top right badges: Raised Hand & Pin Button */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-90 transition-opacity">
        {isHandRaised && (
          <span className="flex items-center gap-1 rounded-lg bg-amber-500 px-2 py-1 text-xs font-semibold text-slate-950 shadow-md animate-bounce">
            <Hand className="h-3.5 w-3.5" /> Raised Hand
          </span>
        )}
        {onTogglePin && (
          <button
            onClick={onTogglePin}
            title={isPinned ? 'Unpin participant' : 'Pin participant'}
            className={`rounded-lg p-1.5 text-white backdrop-blur-md transition-colors ${
              isPinned
                ? 'bg-indigo-600 hover:bg-indigo-500'
                : 'bg-slate-950/60 hover:bg-slate-950/90'
            }`}
          >
            <Pin className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Screen Sharing Indicator */}
      {isSharingScreen && (
        <div className="absolute top-2.5 left-2.5 rounded-lg bg-indigo-600/90 backdrop-blur-md px-2 py-1 text-[11px] font-medium text-white shadow-sm flex items-center gap-1">
          <Maximize2 className="h-3 w-3" /> Screen Shared
        </div>
      )}
    </div>
  );
};
