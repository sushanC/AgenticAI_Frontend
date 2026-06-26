import { useState } from 'react';
import { useEffect } from 'react';
import axios from 'axios';

const THINKING_PHASES = [
  { label: 'Thinking...', step: 'thinking' },
  { label: 'Analyzing request...', step: 'analyzing' },
  { label: 'Searching memory...', step: 'memory' },
  { label: 'Generating response...', step: 'generating' },
];

// Prefix written by server.js when a confirmation-gated tool fires
const CONFIRMATION_MARKER = '__CONFIRMATION__:';

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
      let isConfirmation = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullText += chunk;

        // ── Phase 3: Confirmation Detection ─────────────────────────────────
        // If the accumulated text starts with the confirmation marker,
        // stop streaming text and wait for the full JSON before parsing.
        // The server sends the full payload in one write(), so we have it
        // all by the time the stream closes (done === true above breaks).
        if (fullText.startsWith(CONFIRMATION_MARKER)) {
          isConfirmation = true;
          // Remove the placeholder assistant bubble (shows nothing while loading)
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantId
                ? { ...msg, content: '', streaming: true }
                : msg
            )
          );
          continue; // Keep reading until done (in case of chunked send)
        }
        // ────────────────────────────────────────────────────────────────────

        // Normal text streaming — update the assistant bubble incrementally
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantId
              ? { ...msg, content: fullText, streaming: true }
              : msg
          )
        );
      }

      // ── Finalize ───────────────────────────────────────────────────────────
      if (isConfirmation) {
        // Parse the JSON payload after the marker prefix
        try {
          const jsonStr = fullText.slice(CONFIRMATION_MARKER.length);
          const confirmationData = JSON.parse(jsonStr);

          // Replace the blank assistant bubble with a confirmation-type message
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content: '',
                    streaming: false,
                    type: 'confirmation',
                    confirmationData
                  }
                : msg
            )
          );
        } catch (parseErr) {
          console.error('Failed to parse confirmation JSON:', parseErr);
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantId
                ? { ...msg, content: '⚠️ Failed to parse confirmation response.', streaming: false }
                : msg
            )
          );
        }
      } else {
        // Normal text message — mark as done
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantId
              ? { ...msg, content: fullText, streaming: false }
              : msg
          )
        );
      }
      // ──────────────────────────────────────────────────────────────────────

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

  /**
   * Called by ConfirmationCard after the user clicks [Confirm].
   * Injects a success/result message into the chat.
   *
   * @param {object} result - Response from POST /confirm
   * @param {string} confirmationId - The ID of the confirmed action
   */
  function handleConfirmed(result, confirmationId) {
    // Mark the confirmation card as resolved
    setMessages(prev =>
      prev.map(msg =>
        msg.type === 'confirmation' &&
        msg.confirmationData?.confirmationId === confirmationId
          ? { ...msg, type: 'confirmation_done' }
          : msg
      )
    );

    // Append a result message from the backend
    const resultText = result?.result
      ? String(result.result)
      : '✅ Action confirmed and completed.';

    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        role: 'assistant',
        content: resultText,
        timestamp: new Date(),
        streaming: false
      }
    ]);
  }

  /**
   * Called by ConfirmationCard after the user clicks [Cancel].
   * Injects a cancellation notice into the chat.
   *
   * @param {string} confirmationId - The ID of the cancelled action
   */
  function handleCancelled(confirmationId) {
    setMessages(prev =>
      prev.map(msg =>
        msg.type === 'confirmation' &&
        msg.confirmationData?.confirmationId === confirmationId
          ? { ...msg, type: 'confirmation_done' }
          : msg
      )
    );

    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        role: 'assistant',
        content: '🚫 Action cancelled.',
        timestamp: new Date(),
        streaming: false
      }
    ]);
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
    handleConfirmed,
    handleCancelled,
  };
}
