import React, { useRef, useEffect, useState } from 'react';
import { Sparkles, ArrowDown, Zap, Shield, Palette, Database } from 'lucide-react';
import { Conversation } from '../types';
import { MessageItem } from './MessageItem';

interface ChatAreaProps {
  activeConversation: Conversation | null;
  isGenerating: boolean;
  onSelectPrompt: (prompt: string) => void;
  onRegenerate: () => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onCopyIntoInput?: (text: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  activeConversation,
  isGenerating,
  onSelectPrompt,
  onRegenerate,
  onEditMessage,
  onCopyIntoInput,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollToBottom = (smooth = true) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [activeConversation?.messages.length, isGenerating]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceToBottom > 150);
  };

  const messages = activeConversation?.messages || [];
  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 scroll-smooth scrollbar-thin"
      >
        {!hasMessages ? (
          // Empty State
          <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center px-4 max-w-2xl mx-auto animate-fade-in">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 p-0.5 shadow-2xl shadow-indigo-500/30 flex items-center justify-center animate-pulse">
                <div className="w-full h-full bg-[#090D16] rounded-[14px] flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-cyan-400" />
                </div>
              </div>
              <div
                className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-[#080C14]"
                title="Gemini Ready"
              />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
              What will we build today with <span className="gemini-gradient-text">Gemini</span>?
            </h2>
            <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
              Fast, multimodal-capable AI architecture ready for Next.js, React component engineering, API integrations, and code optimizations.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full text-left">
              <div
                onClick={() => onSelectPrompt('How do I build a streaming AI response in Next.js using ReadableStream?')}
                className="p-4 rounded-xl bg-[#0F172A] border border-[#233148] hover:border-indigo-500/50 hover:bg-[#152037] cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2 text-indigo-400 font-medium text-xs mb-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Streaming Responses</span>
                </div>
                <p className="text-xs text-slate-400 group-hover:text-slate-200 leading-relaxed">
                  How do I stream Gemini tokens to a Next.js chat interface using ReadableStream?
                </p>
              </div>

              <div
                onClick={() => onSelectPrompt('Write a secure TypeScript Route Handler that validates input with Zod')}
                className="p-4 rounded-xl bg-[#0F172A] border border-[#233148] hover:border-indigo-500/50 hover:bg-[#152037] cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2 text-cyan-400 font-medium text-xs mb-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Type Safety & Validation</span>
                </div>
                <p className="text-xs text-slate-400 group-hover:text-slate-200 leading-relaxed">
                  Generate a Next.js API route that validates inputs and hides the GEMINI_API_KEY.
                </p>
              </div>

              <div
                onClick={() => onSelectPrompt('Explain Tailwind CSS dark mode configuration with CSS variables and responsive design')}
                className="p-4 rounded-xl bg-[#0F172A] border border-[#233148] hover:border-indigo-500/50 hover:bg-[#152037] cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2 text-purple-400 font-medium text-xs mb-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-400" />
                  <span>Modern UI Styling</span>
                </div>
                <p className="text-xs text-slate-400 group-hover:text-slate-200 leading-relaxed">
                  Set up dynamic Tailwind color tokens and responsive glassmorphism for dark/light themes.
                </p>
              </div>

              <div
                onClick={() => onSelectPrompt('How to manage persistent state in LocalStorage without React hydration errors?')}
                className="p-4 rounded-xl bg-[#0F172A] border border-[#233148] hover:border-indigo-500/50 hover:bg-[#152037] cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2 text-emerald-400 font-medium text-xs mb-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Reliable Storage Sync</span>
                </div>
                <p className="text-xs text-slate-400 group-hover:text-slate-200 leading-relaxed">
                  Fix Next.js SSR mismatch warnings when reading window.localStorage in custom hooks.
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Message List
          messages.map((msg, index) => {
            const isLastAssistant =
              msg.role === 'assistant' &&
              index === messages.length - 1;

            return (
              <MessageItem
                key={msg.id}
                message={msg}
                onRegenerate={onRegenerate}
                isLastAssistant={isLastAssistant}
                onEditMessage={onEditMessage}
                onCopyIntoInput={onCopyIntoInput}
              />
            );
          })
        )}

        {/* Typing / Loading Indicator */}
        {isGenerating && (
          <div className="flex items-start gap-3 sm:gap-4 animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 p-0.5 shrink-0 shadow-md shadow-indigo-500/20 mt-1">
              <div className="w-full h-full bg-[#080C14] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div className="flex-1 max-w-[85%]">
              <div className="text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                Gemini <span className="text-[10px] text-indigo-400 font-normal">is thinking...</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-[#0F172A] border border-[#1E293B] shadow-sm">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-4 right-6 p-2 rounded-full bg-[#1E293B]/90 hover:bg-indigo-600 text-slate-300 hover:text-white shadow-xl border border-slate-700 transition-all transform hover:scale-105 z-20"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
