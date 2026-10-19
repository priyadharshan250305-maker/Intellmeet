import React from 'react';

export interface FloatingReaction {
  id: string;
  emoji: string;
  senderName?: string;
  leftPercent: number;
  driftPx?: number;
}

interface FloatingReactionsProps {
  reactions: FloatingReaction[];
}

export const FloatingReactions: React.FC<FloatingReactionsProps> = ({ reactions }) => {
  if (reactions.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {reactions.map((r) => (
        <div
          key={r.id}
          className="absolute bottom-20 flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-700/60 bg-slate-900/85 px-3 py-1.5 shadow-2xl backdrop-blur-sm animate-float-up"
          style={{
            left: `${r.leftPercent}%`,
            willChange: 'transform, opacity',
          }}
        >
          <span className="text-2xl sm:text-3xl select-none leading-none">
            {r.emoji}
          </span>
          {r.senderName && (
            <span className="text-[11px] sm:text-xs font-semibold text-slate-200 truncate max-w-[100px] sm:max-w-[140px] select-none">
              {r.senderName}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
