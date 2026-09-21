import React from 'react';
import { Menu, Sparkles, Key, RotateCcw, Plus } from 'lucide-react';
import { Conversation, GeminiModelInfo } from '../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  activeConversation: Conversation | null;
  onNewChat: () => void;
  onClearMessages: () => void;
  onOpenSettings: () => void;
  hasApiKey: boolean;
  selectedModel: GeminiModelInfo;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  activeConversation,
  onNewChat,
  onClearMessages,
  onOpenSettings,
  hasApiKey,
  selectedModel,
}) => {
  return (
    <header className="h-14 border-b border-[#1E293B] bg-[#0B111E]/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between shrink-0 z-30">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Mobile sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Toggle Navigation Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* App Logo */}
        <div
          onClick={onNewChat}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
          title="Nexus AI - Start New Chat"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#090D16] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              Nexus AI
              <span className="hidden xs:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {selectedModel.name.replace('Gemini ', '')}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Active Conversation Title in middle (Desktop) */}
      <div className="hidden md:flex items-center gap-2 max-w-sm lg:max-w-md truncate text-xs text-slate-400 px-4">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <span className="font-medium text-slate-300 truncate">
          {activeConversation ? activeConversation.title : 'New Conversation'}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* API Settings Trigger */}
        <button
          onClick={onOpenSettings}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all shadow-sm ${
            hasApiKey
              ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-900/30'
              : 'border-slate-700/80 bg-slate-800/60 hover:bg-slate-700 text-slate-300'
          }`}
          title="Configure API Settings"
        >
          <Key className={`w-3.5 h-3.5 ${hasApiKey ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="hidden sm:inline">
            {hasApiKey ? 'Gemini Connected' : 'Gemini Settings'}
          </span>
        </button>

        {/* Clear Current Chat Messages */}
        <button
          onClick={onClearMessages}
          disabled={!activeConversation || activeConversation.messages.length === 0}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          title="Clear current conversation messages"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>
    </header>
  );
};
