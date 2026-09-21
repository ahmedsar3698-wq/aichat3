import React, { useState } from 'react';
import { Sparkles, Copy, Check, RefreshCw, User, AlertCircle, Pencil, CornerDownLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';

interface MessageItemProps {
  message: Message;
  onRegenerate?: () => void;
  isLastAssistant?: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onCopyIntoInput?: (text: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onRegenerate,
  isLastAssistant = false,
  onEditMessage,
  onCopyIntoInput,
}) => {
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const isUser = message.role === 'user';

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(message.content);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editContent.trim() && onEditMessage) {
      onEditMessage(message.id, editContent.trim());
      setIsEditing(false);
    }
  };

  if (isUser) {
    return (
      <div id={`msg-${message.id}`} className="flex justify-end group transition-all">
        <div className="max-w-[92%] sm:max-w-[80%] md:max-w-[72%] flex flex-col items-end w-full">
          <div className="flex items-center gap-2 mb-1.5 px-1">
            <span className="text-[11px] text-slate-400 font-mono tracking-tight">
              {message.timestamp}
            </span>
            <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
              <User className="w-3 h-3 text-indigo-400" /> You
            </span>
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="w-full bg-[#131B2E] border border-indigo-500/80 rounded-2xl p-3 shadow-xl flex flex-col gap-2.5 animate-fade-in">
              <label className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5">
                <Pencil className="w-3 h-3" />
                <span>Edit your message</span>
              </label>
              <textarea
                dir="auto"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                autoFocus
                className="w-full bg-[#090E18] text-slate-100 placeholder-slate-400 text-sm p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-400 resize-none font-sans"
              />
              <div className="flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(message.content);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editContent.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Save & Resubmit
                </button>
              </div>
            </form>
          ) : (
            <div
              dir="auto"
              className="relative px-4 py-3 rounded-2xl rounded-tr-sm bg-indigo-600 text-white text-sm shadow-lg shadow-indigo-950/40 leading-relaxed break-words whitespace-pre-wrap text-left"
            >
              {message.content}
            </div>
          )}

          {!isEditing && (
            <div className="flex items-center gap-2.5 mt-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 text-xs px-1">
              {/* Edit button */}
              {onEditMessage && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditContent(message.content);
                  }}
                  className="hover:text-indigo-300 flex items-center gap-1 text-[11px] transition-colors py-0.5 cursor-pointer"
                  title="Edit and resubmit message"
                >
                  <Pencil className="w-3 h-3 text-indigo-400" />
                  <span>Edit</span>
                </button>
              )}

              {/* Copy into input */}
              {onCopyIntoInput && (
                <button
                  onClick={() => onCopyIntoInput(message.content)}
                  className="hover:text-cyan-300 flex items-center gap-1 text-[11px] transition-colors py-0.5 cursor-pointer"
                  title="Copy to input box"
                >
                  <CornerDownLeft className="w-3 h-3 text-cyan-400" />
                  <span>Use in input</span>
                </button>
              )}

              {/* Copy button */}
              <button
                onClick={handleCopyRaw}
                className="hover:text-slate-200 flex items-center gap-1 text-[11px] transition-colors py-0.5 cursor-pointer"
                title="Copy message text"
              >
                {copiedRaw ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedRaw ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant Message
  return (
    <div id={`msg-${message.id}`} className="flex items-start gap-3 sm:gap-4 group transition-all">
      {/* Gemini Sparkle Icon */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 p-0.5 shrink-0 shadow-md shadow-indigo-500/20 mt-1">
        <div className="w-full h-full bg-[#080C14] rounded-[10px] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-cyan-400" />
        </div>
      </div>

      <div className="flex-1 min-w-0 max-w-[94%] sm:max-w-[88%]">
        {/* Header with Model & Timestamp */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            Gemini
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 uppercase">
              {message.modelUsed || 'gemini-3.8-flash'}
            </span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">{message.timestamp}</span>
        </div>

        {/* Message Body */}
        {message.isError ? (() => {
          let displayError = message.content;
          try {
            if (typeof displayError === 'string' && displayError.includes('{') && displayError.includes('}')) {
              const match = displayError.match(/\{[\s\S]*\}/);
              if (match) {
                const parsed = JSON.parse(match[0]);
                if (parsed.error?.message) {
                  displayError = parsed.error.message;
                }
              }
            }
          } catch {}

          const isDemandError =
            displayError.toLowerCase().includes('demand') ||
            displayError.toLowerCase().includes('unavailable') ||
            displayError.toLowerCase().includes('503');

          const isNotFoundError =
            displayError.toLowerCase().includes('404') ||
            displayError.toLowerCase().includes('initializing') ||
            displayError.toLowerCase().includes('unreachable');

          return (
            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/50 text-rose-200 text-sm flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-rose-300">
                    {isDemandError
                      ? 'Google Gemini Temporary High Traffic'
                      : isNotFoundError
                      ? 'Backend Service Initializing'
                      : 'API Notice'}
                  </p>
                  <p className="text-xs leading-relaxed text-rose-200/90">
                    {isDemandError
                      ? 'The AI model is experiencing a temporary spike in traffic. Please wait a few seconds and retry, or switch to Gemini Flash Latest / Gemini 3.1 Flash Lite.'
                      : isNotFoundError
                      ? 'The backend server route is currently starting up or was temporarily unavailable. Please click "Retry Request" below to reconnect.'
                      : displayError}
                  </p>
                </div>
              </div>

              {onRegenerate && (
                <div className="flex items-center gap-2 pl-8 pt-0.5">
                  <button
                    type="button"
                    onClick={onRegenerate}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800/80 border border-rose-700/50 text-rose-200 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Request</span>
                  </button>
                </div>
              )}
            </div>
          );
        })() : (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0F172A]/80 border border-[#1E293B] shadow-sm text-slate-200 text-sm leading-relaxed overflow-hidden">
            <div className="markdown-content space-y-3">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !String(children).includes('\n');
                    const codeString = String(children).replace(/\n$/, '');

                    if (isInline) {
                      return (
                        <code
                          className="px-1.5 py-0.5 rounded bg-[#182238] text-cyan-300 font-mono text-[12px] border border-slate-700/60"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }

                    return <CodeBlock language={match ? match[1] : 'code'} code={codeString} />;
                  },
                  h1({ children }) {
                    return <h1 className="text-lg sm:text-xl font-bold text-white mt-4 mb-2 tracking-tight">{children}</h1>;
                  },
                  h2({ children }) {
                    return <h2 className="text-base sm:text-lg font-bold text-white mt-4 mb-2 pb-1 border-b border-slate-800 tracking-tight">{children}</h2>;
                  },
                  h3({ children }) {
                    return <h3 className="text-sm sm:text-base font-semibold text-white mt-3 mb-1.5 tracking-tight">{children}</h3>;
                  },
                  p({ children }) {
                    return <p className="mb-2.5 last:mb-0 leading-relaxed text-slate-200">{children}</p>;
                  },
                  ul({ children }) {
                    return <ul className="space-y-1 my-2 ml-4 list-disc text-slate-300">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="space-y-1 my-2 ml-4 list-decimal text-slate-300">{children}</ol>;
                  },
                  li({ children }) {
                    return <li className="leading-relaxed">{children}</li>;
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-2 border-indigo-500 pl-3 my-2 text-slate-400 italic bg-indigo-950/20 py-1 rounded-r">
                        {children}
                      </blockquote>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto my-3 rounded-lg border border-slate-800">
                        <table className="min-w-full divide-y divide-slate-800 text-xs text-left">{children}</table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return <th className="bg-slate-900/90 px-3 py-2 text-slate-300 font-semibold">{children}</th>;
                  },
                  td({ children }) {
                    return <td className="px-3 py-2 border-t border-slate-800/60 text-slate-300">{children}</td>;
                  },
                  a({ href, children }) {
                    return (
                      <a href={href} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                        {children}
                      </a>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Action Toolbar (only for non-error messages) */}
        {!message.isError && (
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 px-1">
            <button
              onClick={handleCopyRaw}
              className="hover:text-slate-200 flex items-center gap-1.5 text-[11px] transition-colors py-1 cursor-pointer"
              title="Copy entire response"
            >
              {copiedRaw ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedRaw ? 'Copied' : 'Copy response'}</span>
            </button>

            {isLastAssistant && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="hover:text-slate-200 flex items-center gap-1.5 text-[11px] transition-colors py-1 cursor-pointer"
                title="Regenerate this response"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable Syntax Code Block with Top Header & Copy Button
interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-[#2A374F] bg-[#0A0F1D] shadow-lg">
      <div className="bg-[#10172B] px-3.5 py-1.5 flex items-center justify-between border-b border-[#1E293B] text-xs">
        <span className="font-mono text-cyan-400 font-semibold uppercase text-[11px] tracking-wider">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-[11px] font-medium"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-300">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      <div className="p-3.5 sm:p-4 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed scrollbar-thin">
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
