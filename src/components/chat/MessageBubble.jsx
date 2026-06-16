import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const lang = className ? className.replace('language-', '') : 'text';
  const code = String(children).replace(/\n$/, '');

  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-block-lang">{lang}</span>
        <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copy}>
          {copied ? '✓ Copied' : 'Copy code'}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={lang}
        PreTag="div"
        customStyle={{
          margin: 0, borderRadius: 0, background: '#1E1E1E',
          fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', padding: '16px',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function formatTime(t) {
  if (!t) return '';
  return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, isLast, onRegenerate }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isStreaming = message.streaming;

  function handleCopy() {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      className={`message-row ${isUser ? 'user' : 'assistant'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {!isUser && (
        <div className="msg-avatar assistant">✦</div>
      )}

      <div className={`msg-content ${isUser ? 'user' : ''}`}>
        {!isUser && (
          <div className="msg-name">
            Personal Agent
            <span className="msg-time">{formatTime(message.timestamp)}</span>
          </div>
        )}

        <div className="msg-body">
          {isUser ? (
            <div className="user-bubble" style={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
            </div>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    if (inline) return <code className={className} {...props}>{children}</code>;
                    return <CodeBlock className={className}>{children}</CodeBlock>;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
              {isStreaming && <span className="streaming-cursor" />}
            </div>
          )}
        </div>

        {message.content && (
          <div className="msg-actions">
            <button className="msg-action-btn" onClick={handleCopy}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
            {!isUser && isLast && onRegenerate && (
              <button className="msg-action-btn" onClick={onRegenerate}>Regenerate</button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
