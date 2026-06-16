import { useState } from 'react';
import { useEffect } from 'react';
import axios from 'axios';

const THINKING_PHASES = [
  { label: 'Thinking...', step: 'thinking' },
  { label: 'Analyzing request...', step: 'analyzing' },
  { label: 'Searching memory...', step: 'memory' },
  { label: 'Generating response...', step: 'generating' },
];

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [agentPhase, setAgentPhase] = useState(null); // null | 'thinking' | 'analyzing' | 'memory' | 'generating' | 'done'
  const [agentSteps, setAgentSteps] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const res = await axios.get('http://localhost:3001/history');
      setMessages(res.data.slice(-50));
    } catch (err) {
      console.error('History load failed:', err);
    }
  }

  async function sendMessage(text) {
    if (!text.trim() || isStreaming) return;

    const assistantId = Date.now();

    setMessages(prev => [
      ...prev,
      { role: 'user', content: text, timestamp: new Date() },
      { id: assistantId, role: 'assistant', content: '', timestamp: new Date(), streaming: true },
    ]);

    setIsStreaming(true);
    setAgentPhase('thinking');
    setAgentSteps([]);

    // Progress through thinking phases
    const phaseTimings = [0, 900, 1800, 2600];
    const steps = [];

    THINKING_PHASES.forEach((phase, i) => {
      setTimeout(() => {
        setAgentPhase(phase.step);
        if (i < THINKING_PHASES.length - 1) {
          steps.push({ label: phase.label, status: 'done' });
          setAgentSteps([...steps]);
        } else {
          setAgentSteps([...steps, { label: phase.label, status: 'running' }]);
        }
      }, phaseTimings[i]);
    });

    try {
      const response = await fetch('http://localhost:3001/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullText += chunk;

        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantId
              ? { ...msg, content: fullText, streaming: true }
              : msg
          )
        );
      }

      // Done streaming
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantId
            ? { ...msg, content: fullText, streaming: false }
            : msg
        )
      );
    } catch {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantId
            ? { ...msg, content: '⚠️ Failed to get response. Please check if the backend is running.', streaming: false }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
      setAgentPhase('done');
      setTimeout(() => setAgentPhase(null), 1500);
    }
  }

  function clearMessages() {
    setMessages([]);
  }

  return {
    messages,
    isStreaming,
    agentPhase,
    agentSteps,
    sendMessage,
    clearMessages,
    loadHistory,
  };
}
