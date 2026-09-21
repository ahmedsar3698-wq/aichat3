import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowUp, Square, Cpu, Code2, Box, ShieldCheck, Database, Mic, MicOff, X, Sparkles } from 'lucide-react';
import { GeminiModelInfo } from '../types';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: (message: string) => void;
  onStop: () => void;
  isGenerating: boolean;
  selectedModel: GeminiModelInfo;
  onOpenModelSelector?: () => void;
}

const QUICK_PROMPTS = [
  {
    label: 'Next.js 14 Server Actions',
    prompt: 'Explain Next.js 14 Server Actions with code examples and error handling.',
    icon: Code2,
    color: 'text-cyan-400',
  },
  {
    label: 'React Tailwind Modal',
    prompt: 'Write an accessible, reusable React Tailwind Modal component with backdrop blur and escape key listener.',
    icon: Box,
    color: 'text-indigo-400',
  },
  {
    label: 'Secure API Keys in Next.js',
    prompt: 'How do I securely store and call Gemini API in Next.js Route Handlers without exposing GEMINI_API_KEY?',
    icon: ShieldCheck,
    color: 'text-emerald-400',
  },
  {
    label: 'Local Storage Best Practices',
    prompt: 'How to reliably sync React state to localStorage while avoiding SSR hydration errors and race conditions?',
    icon: Database,
    color: 'text-purple-400',
  },
];

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  onStop,
  isGenerating,
  selectedModel,
  onOpenModelSelector,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Auto-focus input on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Auto-resize textarea smoothly
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.max(44, Math.min(textareaRef.current.scrollHeight, 200));
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  // Voice speech-to-text toggle
  const toggleSpeechRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice dictation is not supported in this browser. You can type directly in the box.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition failed to start:', err);
      setIsListening(false);
    }
  }, [isListening, setInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Prevent submission during IME composition (crucial for multilingual & virtual keyboards)
    if (e.nativeEvent.isComposing) {
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isGenerating) {
        onSend(input.trim());
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isGenerating) {
      onSend(input.trim());
    }
  };

  const handleClear = () => {
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSelectPrompt = (prompt: string) => {
    setInput(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 pt-0 bg-gradient-to-t from-[#080C14] via-[#080C14]/95 to-transparent z-10 shrink-0">
      <div className="max-w-4xl mx-auto">
        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2.5 mb-1 scrollbar-none text-xs">
          {QUICK_PROMPTS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPrompt(item.prompt)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-[#131B2E] border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/90 text-slate-300 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              >
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Input Pod Container */}
        <div className="relative rounded-2xl bg-[#0F172A] border border-[#233148] shadow-2xl focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/40 transition-all duration-200">
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="relative flex items-center">
              <textarea
                ref={textareaRef}
                rows={1}
                dir="auto"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isGenerating
                    ? 'Gemini is generating response... You can draft your next question'
                    : 'Message Gemini... (Enter ↵ to send, Shift+Enter for new line)'
                }
                className="w-full bg-transparent text-slate-100 placeholder-slate-400 text-sm px-4 pt-3.5 pb-2 pr-12 resize-none max-h-48 focus:outline-none scrollbar-thin"
              />

              {/* Clear button inside textarea */}
              {input && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-3 p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title="Clear input text"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Inner Controls Toolbar */}
            <div className="flex items-center justify-between px-3.5 pb-2.5 pt-1.5 text-xs text-slate-400 border-t border-slate-800/60 mt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenModelSelector}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50 transition-colors"
                  title="Switch Gemini Model"
                >
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  <span className="font-medium">{selectedModel.name}</span>
                </button>

                <span className="hidden sm:inline text-[11px] text-slate-400">
                  Shift + Enter for new line
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Voice dictation mic button */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`p-2 rounded-xl border transition-all ${
                    isListening
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 animate-pulse'
                      : 'bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 border-slate-700/50'
                  }`}
                  title={isListening ? 'Listening... click to stop' : 'Voice dictation (Speech to text)'}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5" />}
                </button>

                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  {input.trim().length} chars
                </span>

                {isGenerating ? (
                  <button
                    type="button"
                    onClick={onStop}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all font-medium text-xs shadow-sm"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white shadow-md shadow-indigo-600/30 disabled:shadow-none transition-all disabled:cursor-not-allowed active:scale-95"
                    title="Send message"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        <p className="text-[11px] text-center text-slate-400 mt-2">
          Gemini may display inaccurate info. Verify technical outputs.
        </p>
      </div>
    </div>
  );
};
