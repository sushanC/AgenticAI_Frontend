import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [model, setModel] = useState('auto');
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const response = await axios.get('http://localhost:3001/settings');
      if (response.data?.model) setModel(response.data.model);
    } catch (err) {
      console.error(err);
    }
  }

  async function saveModel(value) {
    setModel(value);
    try {
      await axios.post('http://localhost:3001/settings', { model: value });
      toast.success(`Model set to ${value}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings');
    }
  }

  async function exportBackup() {
    try {
      const response = await axios.get('http://localhost:3001/backup');
      const blob = new Blob(
        [JSON.stringify(response.data, null, 2)],
        { type: 'application/json' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `samgpt-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup exported successfully');
    } catch (err) {
      console.error(err);
      toast.error('Backup failed');
    }
  }

  async function handleRestore(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoring(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await axios.post('http://localhost:3001/restore', data);
      toast.success(`Restored: ${data.tasks?.length || 0} tasks, ${data.notes?.length || 0} notes`);
    } catch (err) {
      console.error(err);
      toast.error('Restore failed — invalid backup file');
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">Settings</div>
        <div className="page-subtitle">Configure your samGPT assistant</div>
      </div>
      <div className="settings-container">
        <div className="settings-section">
          <div className="settings-section-title">AI Model</div>
          <div className="settings-card">
            <h3>🤖 Model Selection</h3>
            <p className="settings-desc">
              Choose which AI model samGPT uses for responses. "Auto" uses smart routing based on task type.
            </p>
            <select
              value={model}
              onChange={(e) => saveModel(e.target.value)}
              className="settings-select"
            >
              <option value="auto">Auto (Smart Routing)</option>
              <option value="deepseek">DeepSeek</option>
              <option value="gemini">Gemini</option>
              <option value="groq">Groq</option>
              <option value="openrouter">OpenRouter</option>
              <option value="ollama">Ollama</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Data</div>
          <div className="settings-card">
            <h3>💾 Export Backup</h3>
            <p className="settings-desc">
              Download all your data — tasks, notes, memory, chat history, and settings.
            </p>
            <button className="settings-btn" onClick={exportBackup}>
              Export Backup
            </button>
          </div>
          <div className="settings-card">
            <h3>📥 Restore Backup</h3>
            <p className="settings-desc">
              Restore from a previously exported backup file.
            </p>
            <div className="restore-zone">
              <button
                className="settings-btn secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={restoring}
              >
                {restoring ? 'Restoring...' : 'Choose File'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleRestore}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">About</div>
          <div className="settings-card">
            <div className="settings-info-row">
              <span className="settings-info-label">App</span>
              <span className="settings-info-value">samGPT v1.0.0</span>
            </div>
            <div className="settings-info-row">
              <span className="settings-info-label">Storage</span>
              <span className="settings-info-value">~/.personal-agent/</span>
            </div>
            <div className="settings-info-row">
              <span className="settings-info-label">Models</span>
              <span className="settings-info-value">DeepSeek · Gemini · Groq · OpenRouter · Ollama</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}