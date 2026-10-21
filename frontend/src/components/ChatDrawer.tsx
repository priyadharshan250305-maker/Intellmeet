import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { ChatMessage } from '../types';
import { X, Send } from 'lucide-react';

interface ChatDrawerProps {
  socket: Socket | null;
  roomId: string;
  currentUser: { id?: string; name: string; avatar?: string };
  isOpen: boolean;
  onClose: () => void;
  onNewMessage?: () => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  socket,
  roomId,
  currentUser,
  isOpen,
  onClose,
  onNewMessage,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      if (onNewMessage) onNewMessage();
    };

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [socket, onNewMessage]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !socket) return;

    socket.emit('send-message', {
      roomId,
      message: inputText.trim(),
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderId: currentUser.id,
    });

    setInputText('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 w-full sm:w-96 md:relative md:inset-auto md:w-80 lg:w-96 flex flex-col border-l border-slate-800 bg-slate-900 h-full text-slate-100 shrink-0 shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <div>
          <h3 className="text-sm font-semibold text-white">In-Meeting Chat</h3>
          <p className="text-[11px] text-slate-400">Messages are visible to participants</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
            <p className="text-xs">No messages yet.</p>
            <p className="text-[11px] mt-1">Start the conversation below!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId && msg.senderId === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] font-semibold text-slate-300">
                    {isMe ? 'You' : msg.senderName}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className="border-t border-slate-800 p-3 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send a message to everyone..."
          className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
