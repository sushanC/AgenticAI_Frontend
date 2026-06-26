import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MODELS = ['Auto', 'DeepSeek', 'Gemini', 'Groq', 'OpenRouter', 'Ollama'];

export default function MessageInput({ onSend, isStreaming, initialValue = '' }) {
  const [text, setText] = useState(initialValue);
  const [selectedModel, setSelectedModel] = useState('Auto');
  const [showModels, setShowModels] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, [text]);

  useEffect(() => {
    if (initialValue) {
      setText(initialValue);
      textareaRef.current?.focus();
    }
  }, [initialValue]);

  const handleSend = useCallback(() => {
    if (!text.trim() || isStreaming) return;
    onSend(text.trim());
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [text, isStreaming, onSend]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const canSend = text.trim().length > 0 && !isStreaming;

  return (
    <div className="input-area">
      <div className="input-container">
        <AnimatePresence>
          {showModels && (
            <motion.div
              className="model-dropdown"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.12 }}
            >
              {MODELS.map(m => (
                <button
                  key={m}
                  className={`model-option ${m === selectedModel ? 'selected' : ''}`}
                  onClick={() => { setSelectedModel(m); setShowModels(false); }}
                >
                  {m}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="input-box">
          <button className="input-left-btn" title="Attach" disabled={isStreaming}>📎</button>

          <textarea
            ref={textareaRef}
            className="input-textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? 'Generating...' : 'Message samGPT'}
            disabled={isStreaming}
            rows={1}
          />

          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!canSend}
          >
            ↑
          </button>
        </div>

        <div className="input-footer">
          <span className="input-hint">Enter to send, Shift+Enter for new line</span>
          <button
            className="input-model-pill"
            onClick={() => setShowModels(s => !s)}
          >
            {selectedModel} ▾
          </button>
        </div>
      </div>
    </div>
  );
}
