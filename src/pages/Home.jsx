import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

import Sidebar from '../components/layout/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import MessageInput from '../components/chat/MessageInput';
import MemoryPage from '../components/pages/MemoryPage';
import TasksPage from '../components/pages/TasksPage';
import NotesPage from '../components/pages/NotesPage';
import PDFPage from '../components/pages/PDFPage';

import { useChat } from '../hooks/useChat';
import { useTasks } from '../hooks/useTasks';
import { useMemory } from '../hooks/useMemory';

export default function Home() {
  const [page, setPage] = useState('chat');
  const [quickActionPrompt, setQuickActionPrompt] = useState('');

  const { messages, isStreaming, agentPhase, agentSteps, sendMessage, clearMessages } = useChat();
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

  return (
    <div className="app-shell">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#2F2F2F',
            color: '#ECECEC',
            border: '1px solid rgba(255,255,255,0.08)',
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
          <motion.div
            key={page}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {page === 'notes' && <NotesPage />}
            {page === 'tasks' && <TasksPage />}
            {page === 'pdfs' && <PDFPage />}
            {page === 'memory' && <MemoryPage />}
            {page === 'chat' && (
              <>
                <ChatWindow
                  messages={messages}
                  isStreaming={isStreaming}
                  agentPhase={agentPhase}
                  onQuickAction={handleQuickAction}
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
        </AnimatePresence>
      </div>
    </div>
  );
}