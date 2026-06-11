import VoiceButton from "./VoiceButton";
export default function Sidebar() {

  return (

    <div
      style={{
        width: "250px",
        background: "#1e1e1e",
        color: "white",
        padding: "20px"
      }}
    >

      <h2>Personal Agent</h2>

      <hr />

      <p>📝 Notes</p>

      <p>✅ Tasks</p>

      <p>📄 PDFs</p>

      <VoiceButton />

      <p>⚙ Settings</p>

    </div>

  );
}