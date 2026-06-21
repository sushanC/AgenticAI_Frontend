import { useState } from "react";
import axios from "axios";

export default function SettingsPage() {

  const [model, setModel] =
    useState("DeepSeek");

async function loadSettings() {

  try {

    const response =
      await axios.get(
        "http://localhost:3001/settings"
      );

    setModel(
      response.data.model
    );

  } catch (err) {

    console.error(err);
  }
}  

async function saveModel(
  value
) {

  try {

    await axios.post(
      "http://localhost:3001/settings",
      {
        model: value
      }
    );

  } catch (err) {

    console.error(err);
  }
}

async function exportBackup() {

  try {

    const response =
      await axios.get(
        "http://localhost:3001/backup"
      );

    const blob =
      new Blob(
        [
          JSON.stringify(
            response.data,
            null,
            2
          )
        ],
        {
          type:
            "application/json"
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const a =
      document.createElement(
        "a"
      );

    a.href = url;

    a.download =
      "personal-agent-backup.json";

    a.click();

    URL.revokeObjectURL(
      url
    );

  } catch (err) {

    console.error(
      err
    );
  }
}

  useEffect(() => {

  loadSettings();

}, []);

  return (
    <div className="settings-container">

  <div className="settings-card">
    <h3>🤖 AI Model</h3>

    <p className="settings-desc">
      Select which model your Personal Agent uses.
    </p>

<select
  value={model}
  onChange={(e) => {

    const value =
      e.target.value;

    setModel(
      value
    );

    saveModel(
      value
    );
  }}
  className="settings-select"
>

  <option>
    DeepSeek
  </option>

  <option>
    Gemini
  </option>

  <option>
    OpenAI
  </option>

</select>
  </div>

  <div className="settings-card">
    <h3>💾 Backup</h3>

    <p className="settings-desc">
      Export all memories, notes, tasks and PDFs.
    </p>

<button
  className="settings-btn"
  onClick={() => {
    alert("Backup feature coming soon");
  }}
>
  Export Backup
</button>
  </div>

</div>
  );
}