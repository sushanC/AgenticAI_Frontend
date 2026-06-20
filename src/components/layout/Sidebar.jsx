import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { id: 'chat', icon: '💬', label: 'Chat' },
  { id: 'notes', icon: '📝', label: 'Notes' },
  { id: 'tasks', icon: '✅', label: 'Tasks' },
  { id: 'pdfs', icon: '📄', label: 'PDFs' },
  { id: 'memory', icon: '🧠', label: 'Memory' },
  { id: 'settings', icon: '⚙️', label: 'Settings' }
];

export default function Sidebar({ page, setPage, onNewChat, taskCount = 0, memoryCount = 0 }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">✦</div>
        <div>
          <div className="sidebar-title">Personal Agent</div>
          <div className="sidebar-sub">AI Assistant</div>
        </div>
      </div>

      <button className="new-chat-btn" onClick={onNewChat}>
        <span>+</span>
        <span>New chat</span>
      </button>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <motion.button
            key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
            whileTap={{ scale: 0.98 }}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </motion.button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="model-pill">
          <span className="model-dot" />
          <span>DeepSeek</span>
        </div>
        <div className="sidebar-info">
          <span>Memory</span>
          <span className="sidebar-info-value">{memoryCount} facts</span>
        </div>
        <div className="sidebar-info">
          <span>Tasks</span>
          <span className="sidebar-info-value">{taskCount} pending</span>
        </div>
      </div>
    </div>
  );
}
