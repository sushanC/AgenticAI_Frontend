import { motion } from 'framer-motion';

const ACTIONS = [
  { id: 'research', icon: '🔍', label: 'Research a topic', prompt: 'Research the topic: ' },
  { id: 'code', icon: '💻', label: 'Write some code', prompt: 'Write code for: ' },
  { id: 'pdf', icon: '📄', label: 'Search my PDFs', prompt: 'Search my PDFs for: ' },
  { id: 'task', icon: '✅', label: 'Create a task', prompt: 'Help me create a task for: ' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

export default function WelcomeScreen({ onAction }) {
  return (
    <div className="welcome-screen">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ width: '100%' }}
      >
        <div className="welcome-greeting">{getGreeting()}</div>
        <div className="welcome-subtitle">How can I help you today?</div>

        <div className="quick-actions">
          {ACTIONS.map(a => (
            <button key={a.id} className="quick-action" onClick={() => onAction(a.prompt)}>
              <span className="quick-action-icon">{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
