import React, { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Key, Cpu, Database, Check, ShieldCheck } from 'lucide-react';
import { Conversation, GeminiModelInfo, AVAILABLE_MODELS } from '../types';

// 1. Rename Modal
interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  onRename: (id: string, newTitle: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  onClose,
  conversation,
  onRename,
}) => {
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (conversation) {
      setTitle(conversation.title);
    }
  }, [conversation]);

  if (!isOpen || !conversation) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onRename(conversation.id, title.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0F172A] border border-[#2A374F] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-5 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Edit2 className="w-4 h-4 text-indigo-400" />
            <span>Rename Conversation</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full bg-[#131B2E] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            placeholder="Conversation title..."
          />

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            >
              Save Title
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 2. Delete Confirmation Modal
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  onConfirmDelete: (id: string) => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  conversation,
  onConfirmDelete,
}) => {
  if (!isOpen || !conversation) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0F172A] border border-[#2A374F] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-5 space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <Trash2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Delete Conversation?</h3>
            <p className="text-xs text-slate-400">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800 line-clamp-2">
          &ldquo;{conversation.title}&rdquo; with {conversation.messages.length} message(s) will be permanently removed from Local Storage.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirmDelete(conversation.id);
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. Clear All Confirmation Modal
interface ClearAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClearAll: () => void;
}

export const ClearAllModal: React.FC<ClearAllModalProps> = ({
  isOpen,
  onClose,
  onConfirmClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0F172A] border border-[#2A374F] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-5 space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <Trash2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Clear All Conversations?</h3>
            <p className="text-xs text-slate-400">Wipe entire Local Storage history</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          All conversation logs and message histories saved in your browser will be purged. A clean new chat session will be initialized.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirmClearAll();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 transition-all"
          >
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
};

// 4. Settings Modal
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasApiKey: boolean;
  selectedModel: GeminiModelInfo;
  onSelectModel: (model: GeminiModelInfo) => void;
  totalConversations: number;
  totalMessages: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  hasApiKey,
  selectedModel,
  onSelectModel,
  totalConversations,
  totalMessages,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0F172A] border border-[#2A374F] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2A374F] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Nexus AI Configuration</h3>
              <p className="text-xs text-slate-400">Gemini models & Local Storage telemetry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {/* API Key Status */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className={`w-4 h-4 ${hasApiKey ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span>Gemini API Environment</span>
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                  hasApiKey
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {hasApiKey ? 'API Key Detected' : 'Pending API Key'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Environment variable: <code className="text-indigo-300 font-mono">GEMINI_API_KEY</code>.
              Your key is strictly stored server-side and never exposed to client browsers or JavaScript bundles.
            </p>
          </div>

          {/* Model Selection */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between font-semibold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Active Gemini Model</span>
              </span>
              <span className="text-[11px] font-mono text-cyan-400">{selectedModel.id}</span>
            </div>

            <div className="space-y-2 pt-1">
              {AVAILABLE_MODELS.map((model) => {
                const isSelected = model.id === selectedModel.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => onSelectModel(model)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/60 shadow-sm'
                        : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 text-xs">{model.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300 border border-indigo-500/30">
                          {model.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{model.description}</p>
                    </div>

                    <div className="mt-0.5">
                      {isSelected ? (
                        <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Storage Telemetry */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <Database className="w-4 h-4 text-purple-400" />
              <span>Local Storage Telemetry</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-slate-300">
              <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Saved Conversations</span>
                <span className="text-sm font-semibold text-white">{totalConversations}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Total Messages</span>
                <span className="text-sm font-semibold text-white">{totalMessages}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#2A374F] bg-[#0A0F1D] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
