import { motion } from 'framer-motion';

const TOOLS = [
  { key: 'web', icon: '🔍', label: 'Web Search' },
  { key: 'memory', icon: '🧠', label: 'Memory Lookup' },
  { key: 'pdf', icon: '📄', label: 'PDF Search' },
  { key: 'model', icon: '🤖', label: 'DeepSeek' },
];

export default function AgentActivityPanel({ phase }) {
  if (!phase || phase === 'done') return null;

  const completed = [];
  if (['analyzing', 'memory', 'generating'].includes(phase)) completed.push('web');
  if (['memory', 'generating'].includes(phase)) completed.push('memory');
  if (phase === 'generating') completed.push('pdf');
  const activeKey = phase === 'generating' ? 'model' : null;

  return (
    <motion.div
      className="agent-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {TOOLS.map(tool => {
        const done = completed.includes(tool.key);
        const active = tool.key === activeKey;
        if (!done && !active) return null;
        return (
          <motion.div
            key={tool.key}
            className="agent-step"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <span className="agent-step-icon">{tool.icon}</span>
            <span className="agent-step-text">{tool.label}</span>
            <span className={`agent-step-status ${done ? 'done' : 'running'}`}>
              {done ? '✓ Complete' : (
                <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  Generating...
                </motion.span>
              )}
            </span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
