import { useState } from "react";

export default function SettingsPage() {

  const [model, setModel] =
    useState("DeepSeek");

  return (
    <div className="settings-container">

  <div className="settings-card">
    <h3>🤖 AI Model</h3>

    <p className="settings-desc">
      Select which model your Personal Agent uses.
    </p>

    <select
      value={model}
      onChange={(e) => setModel(e.target.value)}
      className="settings-select"
    >
      <option>DeepSeek</option>
      <option>Gemini</option>
      <option>OpenAI</option>
    </select>
  </div>

  <div className="settings-card">
    <h3>💾 Backup</h3>

    <p className="settings-desc">
      Export all memories, notes, tasks and PDFs.
    </p>

    <button
      className="settings-btn"
      onClick={exportBackup}
    >
      Export Backup
    </button>
  </div>

</div>
  );
}