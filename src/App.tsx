/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ChatInput } from './components/ChatInput';
import { RenameModal, DeleteModal, ClearAllModal, SettingsModal } from './components/Modals';
import { Conversation, Message, GeminiModelInfo, AVAILABLE_MODELS } from './types';
import { storageService } from './services/storage';
import { chatApiService } from './services/api';
import { Info, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // 1. Core State
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    return storageService.getConversations();
  });

  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    const saved = storageService.getActiveConversationId();
    const convs = storageService.getConversations();
    if (saved && convs.some((c) => c.id === saved)) {
      return saved;
    }
    return convs.length > 0 ? convs[0].id : null;
  });

  const [selectedModel, setSelectedModel] = useState<GeminiModelInfo>(() => {
    const modelId = storageService.getSelectedModel();
    const found = AVAILABLE_MODELS.find((m) => m.id === modelId);
    return found || AVAILABLE_MODELS[0];
  });

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 2. Modals State
  const [renameTarget, setRenameTarget] = useState<Conversation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
  const [isClearAllOpen, setIsClearAllOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 3. Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  // 4. Abort Controller
  const abortControllerRef = useRef<AbortController | null>(null);

  // Show toast notification
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
    }, 2500);
  }, []);

  // Format current timestamp
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check backend health & API key on mount
  useEffect(() => {
    chatApiService.checkHealth().then((res) => {
      setHasApiKey(res.hasApiKey);
    });
  }, []);

  // Persist conversations to storage when changed
  useEffect(() => {
    storageService.saveConversations(conversations);
  }, [conversations]);

  // Persist activeChatId
  useEffect(() => {
    if (activeChatId) {
      storageService.setActiveConversationId(activeChatId);
    }
  }, [activeChatId]);

  // Global keyboard shortcuts (Cmd+N / Ctrl+N for new chat)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Active Conversation Object
  const activeConversation = conversations.find((c) => c.id === activeChatId) || null;

  // New Chat Handler
  const handleNewChat = useCallback(() => {
    const newId = `chat-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveChatId(newId);
    showToast('Started new conversation', 'success');
  }, [showToast]);

  // Select Conversation
  const handleSelectConversation = (id: string) => {
    setActiveChatId(id);
  };

  // Rename Conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            title: newTitle,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
    showToast('Conversation renamed', 'success');
  };

  // Delete Conversation
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (activeChatId === id) {
        setActiveChatId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });

    if (conversations.length <= 1) {
      handleNewChat();
    }
    showToast('Conversation deleted', 'info');
  };

  // Clear All Conversations
  const handleClearAllConversations = () => {
    const freshId = `chat-${Date.now()}`;
    const freshConv: Conversation = {
      id: freshId,
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setConversations([freshConv]);
    setActiveChatId(freshId);
    showToast('All conversations cleared', 'info');
  };

  // Clear Current Chat Messages
  const handleClearCurrentMessages = () => {
    if (!activeChatId) return;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeChatId) {
          return {
            ...c,
            title: 'New Conversation',
            messages: [],
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
    showToast('Messages cleared', 'info');
  };

  // Model Selection
  const handleSelectModel = (model: GeminiModelInfo) => {
    setSelectedModel(model);
    storageService.setSelectedModel(model.id);
    showToast(`Switched to ${model.name}`, 'info');
  };

  // Send Message Handler
  const handleSendMessage = async (userText: string) => {
    if (isGenerating || !userText.trim()) return;

    let targetConv = activeConversation;

    // Create a new conversation if none exists
    if (!targetConv) {
      const newId = `chat-${Date.now()}`;
      targetConv = {
        id: newId,
        title: userText.length > 30 ? `${userText.slice(0, 30)}...` : userText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      setConversations((prev) => [targetConv!, ...prev]);
      setActiveChatId(newId);
    }

    // Auto-title conversation if still default
    const isFirstMessage = targetConv.messages.length === 0 || targetConv.title === 'New Conversation';
    const newTitle = isFirstMessage
      ? userText.length > 32
        ? `${userText.slice(0, 32)}...`
        : userText
      : targetConv.title;

    // Create User Message
    const userMsg: Message = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: getCurrentTime(),
    };

    // Update conversation with user message
    const updatedMessages = [...targetConv.messages, userMsg];

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === targetConv!.id) {
          return {
            ...c,
            title: newTitle,
            updatedAt: new Date().toISOString(),
            messages: updatedMessages,
          };
        }
        return c;
      })
    );

    // Clear input
    setInput('');
    setIsGenerating(true);

    // Prepare API history
    const historyPayload = targetConv.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await chatApiService.sendMessage(
        userText,
        historyPayload,
        selectedModel.id,
        controller.signal
      );

      const assistantMsg: Message = {
        id: `msg-a-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        modelUsed: response.model || selectedModel.id,
        timestamp: getCurrentTime(),
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetConv!.id) {
            return {
              ...c,
              updatedAt: new Date().toISOString(),
              messages: [...c.messages, assistantMsg],
            };
          }
          return c;
        })
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        showToast('Generation stopped', 'info');
      } else {
        console.error('Chat error:', err);
        const errorMsg: Message = {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: err.message || 'Unable to connect to Google Gemini. Please check your network connection.',
          timestamp: getCurrentTime(),
          isError: true,
        };

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === targetConv!.id) {
              return {
                ...c,
                updatedAt: new Date().toISOString(),
                messages: [...c.messages, errorMsg],
              };
            }
            return c;
          })
        );
        showToast('Error communicating with Gemini', 'error');
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Edit user message and re-generate from that point
  const handleEditUserMessage = async (messageId: string, newContent: string) => {
    if (!activeConversation || isGenerating || !newContent.trim()) return;

    const msgIndex = activeConversation.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const updatedUserMsg: Message = {
      ...activeConversation.messages[msgIndex],
      content: newContent,
      timestamp: getCurrentTime(),
    };

    // Keep all messages up to this user message, discarding subsequent ones so AI regenerates cleanly
    const prunedMessages = [...activeConversation.messages.slice(0, msgIndex), updatedUserMsg];

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversation.id) {
          return {
            ...c,
            updatedAt: new Date().toISOString(),
            messages: prunedMessages,
          };
        }
        return c;
      })
    );

    setIsGenerating(true);

    const historyPayload = activeConversation.messages.slice(0, msgIndex).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await chatApiService.sendMessage(
        newContent,
        historyPayload,
        selectedModel.id,
        controller.signal
      );

      const assistantMsg: Message = {
        id: `msg-a-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        modelUsed: response.model || selectedModel.id,
        timestamp: getCurrentTime(),
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConversation.id) {
            return {
              ...c,
              updatedAt: new Date().toISOString(),
              messages: [...prunedMessages, assistantMsg],
            };
          }
          return c;
        })
      );
      showToast('Prompt updated and response regenerated', 'success');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        showToast('Generation stopped', 'info');
      } else {
        console.error('Chat edit error:', err);
        const errorMsg: Message = {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: err.message || 'Unable to connect to Google Gemini.',
          timestamp: getCurrentTime(),
          isError: true,
        };

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === activeConversation.id) {
              return {
                ...c,
                updatedAt: new Date().toISOString(),
                messages: [...prunedMessages, errorMsg],
              };
            }
            return c;
          })
        );
        showToast('Error communicating with Gemini', 'error');
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Regenerate last response
  const handleRegenerate = async () => {
    if (!activeConversation || activeConversation.messages.length === 0 || isGenerating) return;

    // Find the last user message index
    let lastUserIndex = -1;
    for (let i = activeConversation.messages.length - 1; i >= 0; i--) {
      if (activeConversation.messages[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) return;

    const lastUserMessage = activeConversation.messages[lastUserIndex];
    // Keep messages up to the last user message, discarding trailing assistant/error message
    const trimmedMessages = activeConversation.messages.slice(0, lastUserIndex + 1);

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversation.id) {
          return {
            ...c,
            updatedAt: new Date().toISOString(),
            messages: trimmedMessages,
          };
        }
        return c;
      })
    );

    setIsGenerating(true);

    const historyPayload = activeConversation.messages.slice(0, lastUserIndex).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await chatApiService.sendMessage(
        lastUserMessage.content,
        historyPayload,
        selectedModel.id,
        controller.signal
      );

      const assistantMsg: Message = {
        id: `msg-a-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        modelUsed: response.model || selectedModel.id,
        timestamp: getCurrentTime(),
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConversation.id) {
            return {
              ...c,
              updatedAt: new Date().toISOString(),
              messages: [...trimmedMessages, assistantMsg],
            };
          }
          return c;
        })
      );
      showToast('Response regenerated', 'success');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        showToast('Generation stopped', 'info');
      } else {
        console.error('Regenerate error:', err);
        const errorMsg: Message = {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: err.message || 'Unable to connect to Google Gemini.',
          timestamp: getCurrentTime(),
          isError: true,
        };

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === activeConversation.id) {
              return {
                ...c,
                updatedAt: new Date().toISOString(),
                messages: [...trimmedMessages, errorMsg],
              };
            }
            return c;
          })
        );
        showToast('Error communicating with Gemini', 'error');
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Stats calculation
  const totalConversations = conversations.length;
  const totalMessages = conversations.reduce((acc, c) => acc + c.messages.length, 0);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#080C14] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Header */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        activeConversation={activeConversation}
        onNewChat={handleNewChat}
        onClearMessages={handleClearCurrentMessages}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasApiKey={hasApiKey}
        selectedModel={selectedModel}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          conversations={conversations}
          activeChatId={activeChatId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onOpenRename={(conv) => setRenameTarget(conv)}
          onOpenDelete={(conv) => setDeleteTarget(conv)}
          onOpenClearAll={() => setIsClearAllOpen(true)}
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        {/* Chat Workspace */}
        <main className="flex-1 flex flex-col h-full bg-[#080C14] relative overflow-hidden min-w-0">
          {/* Informational Banner if API key is not configured */}
          {!hasApiKey && (
            <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-200/90 shrink-0">
              <div className="flex items-center gap-2 truncate">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">
                  Running in <strong>Interactive Simulator & Full-Stack Mode</strong>. Add your <span className="font-mono text-amber-300">GEMINI_API_KEY</span> in Settings for live cloud inference.
                </span>
              </div>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-xs text-amber-300 hover:text-amber-100 underline font-medium shrink-0 ml-3"
              >
                Configure
              </button>
            </div>
          )}

          {/* Chat Messages Area */}
          <ChatArea
            activeConversation={activeConversation}
            isGenerating={isGenerating}
            onSelectPrompt={(prompt) => {
              setInput(prompt);
            }}
            onRegenerate={handleRegenerate}
            onEditMessage={handleEditUserMessage}
            onCopyIntoInput={(text) => {
              setInput(text);
              showToast('Prompt loaded into input', 'info');
            }}
          />

          {/* Chat Input Floating Dock */}
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={handleSendMessage}
            onStop={handleStopGeneration}
            isGenerating={isGenerating}
            selectedModel={selectedModel}
            onOpenModelSelector={() => setIsSettingsOpen(true)}
          />
        </main>
      </div>

      {/* Modals */}
      <RenameModal
        isOpen={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        conversation={renameTarget}
        onRename={handleRenameConversation}
      />

      <DeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        conversation={deleteTarget}
        onConfirmDelete={handleDeleteConversation}
      />

      <ClearAllModal
        isOpen={isClearAllOpen}
        onClose={() => setIsClearAllOpen(false)}
        onConfirmClearAll={handleClearAllConversations}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        hasApiKey={hasApiKey}
        selectedModel={selectedModel}
        onSelectModel={handleSelectModel}
        totalConversations={totalConversations}
        totalMessages={totalMessages}
      />

      {/* Toast Notification Container */}
      {toast && (
        <div
          className={`fixed top-16 right-4 z-50 flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl shadow-2xl border transition-all duration-300 animate-fade-in ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-700/80 text-rose-100'
              : toast.type === 'info'
              ? 'bg-slate-900/95 border-slate-700 text-slate-200'
              : 'bg-emerald-950/90 border-emerald-700/80 text-emerald-100'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
