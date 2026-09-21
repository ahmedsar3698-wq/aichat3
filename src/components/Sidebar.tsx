import React, { useState } from 'react';
import { PlusCircle, Search, MessageSquare, MessageCircle, Edit2, Trash2, Database, X } from 'lucide-react';
import { Conversation } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeChatId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onOpenRename: (conv: Conversation) => void;
  onOpenDelete: (conv: Conversation) => void;
  onOpenClearAll: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeChatId,
  onSelectConversation,
  onNewChat,
  onOpenRename,
  onOpenDelete,
  onOpenClearAll,
  isOpen,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  });

  const formatChatDate = (dateStr: string) => {
    if (!dateStr) return 'Just now';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed md:static inset-y-0 left-0 w-72 md:w-64 lg:w-72 bg-[#0B111E] border-r border-[#1E293B] flex flex-col z-50 transform transition-transform duration-300 ease-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header / New Chat */}
        <div className="p-3 border-b border-[#1E293B]/80 flex flex-col gap-2">
          <div className="flex items-center justify-between md:hidden pb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Conversations</span>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium text-xs shadow-lg shadow-indigo-900/30 transition-all group"
          >
            <span className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform" />
              <span>New Conversation</span>
            </span>
            <kbd className="hidden lg:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-800/60 text-indigo-200 border border-indigo-400/20">
              ⌘N
            </kbd>
          </button>

          {/* Search Input */}
          <div className="relative mt-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-[#131B2E] border border-slate-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500/80 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-thin">
          {filteredConversations.length === 0 ? (
            <div className="py-8 px-4 text-center text-slate-400 text-xs">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
              <p>No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeChatId;
              const msgCount = conv.messages.length;
              const lastDate = formatChatDate(conv.updatedAt || conv.createdAt);

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onCloseMobile();
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-950/70 to-slate-800/80 text-white border border-indigo-500/40 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                    {msgCount > 0 ? (
                      <MessageSquare
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'
                        }`}
                      />
                    ) : (
                      <MessageCircle
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'
                        }`}
                      />
                    )}
                    <div className="truncate flex-1">
                      <p className="text-xs font-medium truncate leading-tight">{conv.title}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {msgCount} msg{msgCount === 1 ? '' : 's'} • {lastDate}
                      </p>
                    </div>
                  </div>

                  {/* Actions (Rename / Delete) */}
                  <div
                    className={`flex items-center gap-1 transition-opacity shrink-0 ${
                      isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenRename(conv);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                      title="Rename conversation"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDelete(conv);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#1E293B] bg-[#070B13]/70 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold text-[11px]">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-slate-200 text-xs font-medium">Local Storage</span>
              <span className="text-[10px] text-slate-400">
                {conversations.length} chat{conversations.length === 1 ? '' : 's'} saved
              </span>
            </div>
          </div>
          <button
            onClick={onOpenClearAll}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
            title="Clear all stored conversations"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    </>
  );
};
