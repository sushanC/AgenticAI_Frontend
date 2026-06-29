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

// Prefix written by server.js when the email tool needs missing information
// Phase 5 — Conversational Action Framework
const WAITING_INPUT_MARKER = '__WAITING_INPUT__:';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [agentPhase, setAgentPhase] = useState(null); // null | 'thinking' | 'analyzing' | 'memory' | 'generating' | 'done'
  const [agentSteps, setAgentSteps] = useState([]);

  // Phase 5: Track active WAITING_FOR_INPUT state.
  // When set, the next sendMessage() call is routed to /email/provide-input
  // instead of /chat/stream — the planner is NOT re-invoked.
  // Shape: { confirmationId: string, missingField: string } | null
  const [activeWaitingInput, setActiveWaitingInput] = useState(null);

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

  /**
   * Primary message send function.
   *
   * Phase 5 routing:
   *   If activeWaitingInput is set (AI asked for missing info),
   *   the user's reply is routed to POST /email/provide-input with the
   *   stored confirmationId. The planner is NOT re-invoked.
   *
   *   Otherwise routes normally to POST /chat/stream.
   */
  async function sendMessage(text) {
    if (!text.trim() || isStreaming) return;

    // ── Phase 5: Waiting Input Routing ─────────────────────────────────────
    if (activeWaitingInput) {
      const { confirmationId } = activeWaitingInput;
      setActiveWaitingInput(null); // Clear immediately to prevent double-routing
      return await provideEmailInput(text, confirmationId);
    }
    // ──────────────────────────────────────────────────────────────────────

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
      let isWaitingInput = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullText += chunk;

        // ── Phase 3: Confirmation Detection ───────────────────────────────
        if (fullText.startsWith(CONFIRMATION_MARKER)) {
          isConfirmation = true;
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantId
                ? { ...msg, content: '', streaming: true }
                : msg
            )
          );
          continue;
        }

        // ── Phase 5: Waiting Input Detection ──────────────────────────────
        // The email tool needs a missing field (e.g. recipientEmail).
        // Don't stream text — wait for full JSON payload.
        if (fullText.startsWith(WAITING_INPUT_MARKER)) {
          isWaitingInput = true;
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantId
                ? { ...msg, content: '', streaming: true }
                : msg
            )
          );
          continue;
        }
        // ──────────────────────────────────────────────────────────────────

        // Normal text streaming — update the assistant bubble incrementally.
        // Guard: skip the update if fullText starts with a protocol marker prefix
        // (__WAITING_INPUT__: or __CONFIRMATION__:) to prevent raw marker text
        // from briefly appearing in the chat bubble during single-chunk responses.
        if (!fullText.startsWith('__')) {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantId
                ? { ...msg, content: fullText, streaming: true }
                : msg
            )
          );
        }
      }

      // ── Finalize ──────────────────────────────────────────────────────────
      if (isConfirmation) {
        try {
          const jsonStr = fullText.slice(CONFIRMATION_MARKER.length);
          const confirmationData = JSON.parse(jsonStr);
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

      } else if (isWaitingInput) {
        // ── Phase 5: Parse waiting_input payload ─────────────────────────
        try {
          const jsonStr = fullText.slice(WAITING_INPUT_MARKER.length);
          const waitingData = JSON.parse(jsonStr);

          // Store the confirmationId so the next sendMessage() routes correctly
          setActiveWaitingInput({
            confirmationId: waitingData.confirmationId,
            missingField: waitingData.missingField || 'recipientEmail'
          });

          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content: '',
                    streaming: false,
                    type: 'waiting_input',
                    waitingData
                  }
                : msg
            )
          );
        } catch (parseErr) {
          console.error('Failed to parse waiting_input JSON:', parseErr);
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantId
                ? { ...msg, content: '⚠️ Failed to parse waiting input response.', streaming: false }
                : msg
            )
          );
        }
        // ──────────────────────────────────────────────────────────────────

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
      // ────────────────────────────────────────────────────────────────────

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
   * Phase 5 — Provides missing email information to a WAITING_FOR_INPUT draft.
   *
   * Called internally by sendMessage() when activeWaitingInput is set.
   * Routes to POST /email/provide-input — the planner is NOT re-invoked.
   * The original draft is preserved and the new confirmationId replaces the old one.
   *
   * If the server returns a validation error (400), the activeWaitingInput is
   * restored so the user can try again without losing the draft context.
   *
   * @param {string} userInput      - The user's reply (email address)
   * @param {string} confirmationId - The ID of the WAITING_FOR_INPUT pending action
   */
  async function provideEmailInput(userInput, confirmationId) {
    const assistantId = Date.now();

    setMessages(prev => [
      ...prev,
      { role: 'user', content: userInput, timestamp: new Date() },
      { id: assistantId, role: 'assistant', content: '', timestamp: new Date(), streaming: true },
    ]);

    setIsStreaming(true);
    setAgentPhase('thinking');

    try {
      const response = await fetch('http://localhost:3001/email/provide-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationId, userInput }),
      });

      // Read the response body (works for both streaming 200 and JSON error responses)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value);
      }

      // Non-OK response — validation error, expired action, etc.
      if (!response.ok) {
        let errMsg = '⚠️ Could not process your input. Please try again.';
        try {
          const errData = JSON.parse(fullText);
          errMsg = errData.message || errMsg;
        } catch { /* use default */ }

        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantId
              ? { ...msg, content: errMsg, streaming: false }
              : msg
          )
        );

        // Restore waiting state so the user can retry without losing the draft
        setActiveWaitingInput({ confirmationId, missingField: 'recipientEmail' });
        return;
      }

      // Success — server responds with __CONFIRMATION__:<json>
      if (fullText.startsWith(CONFIRMATION_MARKER)) {
        try {
          const jsonStr = fullText.slice(CONFIRMATION_MARKER.length);
          const confirmationData = JSON.parse(jsonStr);
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
          console.error('Failed to parse confirmation after input:', parseErr);
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantId
                ? { ...msg, content: '⚠️ Failed to parse confirmation response.', streaming: false }
                : msg
            )
          );
        }
      } else {
        // Unexpected response shape — show as text
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantId
              ? { ...msg, content: fullText || '✅ Input received.', streaming: false }
              : msg
          )
        );
      }

    } catch {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantId
            ? { ...msg, content: '⚠️ Failed to send input. Please check your connection.', streaming: false }
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
    setActiveWaitingInput(null);
  }

  return {
    messages,
    isStreaming,
    agentPhase,
    agentSteps,
    activeWaitingInput,
    sendMessage,
    clearMessages,
    loadHistory,
    handleConfirmed,
    handleCancelled,
  };
}
