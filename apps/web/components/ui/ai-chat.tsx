'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { X, Send, Sparkles, Loader2, Bot } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'How am I progressing this week?',
  'What should I eat after a workout?',
  'How do I improve my bench press?',
  'Is my BMI healthy?',
];

export function AIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sendMessage = useMutation({
    mutationFn: async (text: string) => {
      const history = messages.slice(-12); // keep last 12 for context window
      const { data } = await api.post('/ai/chat', { message: text, history });
      return data.reply as string;
    },
    onSuccess: (reply) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    },
  });

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sendMessage.isPending) return;
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    sendMessage.mutate(trimmed);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sendMessage.isPending]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  return (
    <>
      {/* Floating button — sits above mobile tab bar */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] right-4 lg:bottom-6 z-40 w-13 h-13 bg-violet-600 text-white rounded-full shadow-lg hover:bg-violet-700 active:scale-95 transition-all flex items-center justify-center"
        style={{ width: 52, height: 52 }}
        aria-label="Open AI assistant"
      >
        <Sparkles size={22} />
      </button>

      {/* Chat sheet */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col sm:items-end sm:justify-end sm:p-4 sm:pb-6">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm sm:hidden" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col h-[88dvh] sm:h-[600px]">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 flex-shrink-0 bg-white rounded-t-2xl sm:rounded-t-2xl">
              <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Bot size={17} className="text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm">AI Fitness Assistant</p>
                <p className="text-[10px] text-slate-400">Ask about workouts, nutrition, progress</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-5 pb-4">
                  <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center">
                    <Sparkles size={26} className="text-violet-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-slate-800">Your fitness AI</p>
                    <p className="text-sm text-slate-400 mt-1 max-w-[240px]">
                      Ask me anything about your workouts, health metrics, exercises, or nutrition.
                    </p>
                  </div>
                  <div className="w-full space-y-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => submit(s)}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {m.role === 'assistant' && (
                        <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                          <Bot size={13} className="text-violet-600" />
                        </div>
                      )}
                      <div
                        className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-violet-600 text-white rounded-br-sm'
                            : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {sendMessage.isPending && (
                    <div className="flex justify-start">
                      <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                        <Bot size={13} className="text-violet-600" />
                      </div>
                      <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {/* Input footer */}
            <div className="flex items-center gap-2 px-4 py-3 pb-safe border-t border-slate-100 flex-shrink-0 bg-white">
              <input
                ref={inputRef}
                className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-slate-50 min-h-[2.75rem]"
                placeholder="Ask anything…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submit(input)}
                onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 320)}
                disabled={sendMessage.isPending}
              />
              <button
                onClick={() => submit(input)}
                disabled={!input.trim() || sendMessage.isPending}
                className="w-11 h-11 rounded-xl bg-violet-600 text-white flex items-center justify-center flex-shrink-0 hover:bg-violet-700 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                {sendMessage.isPending ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Send size={17} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
