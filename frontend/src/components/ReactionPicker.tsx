import React, { useEffect, useRef } from 'react';

export const EMOJI_REACTIONS = [
  '👍',
  '❤️',
  '😂',
  '😮',
  '👏',
  '🎉',
  '😢',
  '😡',
  '🤔',
  '🚀',
  '🔥',
];

interface ReactionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReaction: (emoji: string) => void;
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  isOpen,
  onClose,
  onSelectReaction,
}) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 sm:gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/95 px-3 py-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 max-w-[95vw] overflow-x-auto scrollbar-none"
    >
      {EMOJI_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => {
            onSelectReaction(emoji);
            onClose();
          }}
          className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-xl sm:text-2xl transition-all duration-150 hover:scale-125 hover:bg-slate-800/80 active:scale-95 shrink-0 select-none"
          title={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
