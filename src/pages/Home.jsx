import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

import Sidebar from '../components/layout/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import MessageInput from '../components/chat/MessageInput';
import DashboardPage from '../components/pages/DashboardPage';
import MemoryPage from '../components/pages/MemoryPage';
import TasksPage from '../components/pages/TasksPage';
import NotesPage from '../components/pages/NotesPage';
import PDFPage from '../components/pages/PDFPage';
import SettingsPage from '../components/pages/SettingsPage';

import { useChat } from '../hooks/useChat';
import { useTasks } from '../hooks/useTasks';
import { useMemory } from '../hooks/useMemory';

export default function Home() {
  const [page, setPage] = useState('chat');
  const [quickActionPrompt, setQuickActionPrompt] = useState('');

  const { messages, isStreaming, agentPhase, sendMessage, clearMessages, handleConfirmed, handleCancelled } = useChat();
  const { tasks } = useTasks();
  const { facts } = useMemory();

  const pendingTasks = tasks.filter(t => !t.completed).length;

  const handleQuickAction = useCallback((prompt) => {
    setQuickActionPrompt(prompt);
    setPage('chat');
  }, []);

  const handleNewChat = useCallback(() => {
    clearMessages();
    setQuickActionPrompt('');
  }, [clearMessages]);

  // Support Escape Key to exit PDF Workspace
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && page === 'pdfs') {
        // Only trigger if not actively typing in an input or textarea
        if (
          document.activeElement.tagName !== 'INPUT' &&
          document.activeElement.tagName !== 'TEXTAREA' &&
          !document.activeElement.isContentEditable
        ) {
          e.preventDefault();
          setPage('chat');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [page]);

  return (
    <div className="app-shell" style={{ position: 'relative' }}>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1E293B',
            color: '#F8FAFC',
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: '8px',
            fontSize: '14px',
          },
        }}
      />

      <Sidebar
        page={page}
        setPage={setPage}
        onNewChat={handleNewChat}
        taskCount={pendingTasks}
        memoryCount={facts.length}
      />

      <div className="main-content">
        <AnimatePresence mode="wait">
          {page !== 'pdfs' && (
            <motion.div
              key={page}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {page === 'dashboard' && <DashboardPage />}
              {page === 'notes' && <NotesPage />}
              {page === 'tasks' && <TasksPage />}
              {page === 'memory' && <MemoryPage />}
              {page === 'settings' && <SettingsPage />}
              {page === 'chat' && (
                <>
                  <ChatWindow
                    messages={messages}
                    isStreaming={isStreaming}
                    agentPhase={agentPhase}
                    onQuickAction={handleQuickAction}
                    onConfirmed={handleConfirmed}
                    onCancelled={handleCancelled}
                    onRegenerate={() => {
                      const lastUser = [...messages].reverse().find(m => m.role === 'user');
                      if (lastUser) sendMessage(lastUser.content);
                    }}
                  />
                  <MessageInput
                    onSend={sendMessage}
                    isStreaming={isStreaming}
                    initialValue={quickActionPrompt}
                    key={quickActionPrompt}
                  />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 
        PDF Workspace Overlay
        Keeps PDFPage permanently mounted so selected document, loaded PDFs, 
        conversation history, and scroll positions are fully preserved without reloads.
        Animate using Framer Motion (Fade + Slide from the right).
      */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: page === 'pdfs' ? 50 : -1,
          pointerEvents: page === 'pdfs' ? 'auto' : 'none',
          background: 'var(--pdf-bg)',
        }}
        initial={{ opacity: 0, x: 40 }}
        animate={{
          opacity: page === 'pdfs' ? 1 : 0,
          x: page === 'pdfs' ? 0 : 40,
        }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        <PDFPage onBack={() => setPage('chat')} />
      </motion.div>
    </div>
  );
}