import { useEffect, useRef } from 'react';
import WelcomeScreen from './WelcomeScreen';
import MessageBubble from './MessageBubble';
import AgentActivityPanel from './AgentActivityPanel';
import TypingIndicator from './TypingIndicator';

export default function ChatWindow({
  messages, isStreaming, agentPhase, onQuickAction, onRegenerate,
  onConfirmed, onCancelled,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentPhase]);

  const showWelcome = messages.length === 0 && !isStreaming;
  const lastAssistantIdx = messages.map(m => m.role).lastIndexOf('assistant');

  return (
    <div className="chat-area">
      <div className="messages-container">
        {showWelcome ? (
          <WelcomeScreen onAction={onQuickAction} />
        ) : (
          <div className="messages-inner">
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id || i}
                message={msg}
                isLast={i === lastAssistantIdx}
                onRegenerate={i === lastAssistantIdx ? onRegenerate : null}
                onConfirmed={onConfirmed}
                onCancelled={onCancelled}
              />
            ))}

            {isStreaming && agentPhase && agentPhase !== 'done' && (
              <div style={{ paddingLeft: 44 }}>
                <AgentActivityPanel phase={agentPhase} />
                {agentPhase !== 'generating' && <TypingIndicator />}
              </div>
            )}

            <div ref={bottomRef} style={{ height: 1 }} />
          </div>
        )}
      </div>
    </div>
  );
}
