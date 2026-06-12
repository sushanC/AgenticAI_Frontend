import VoiceButton from "./VoiceButton";

export default function Sidebar({
  setPage
}) {

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

      <button
        onClick={() =>
          setPage("notes")
        }
      >
        📝 Notes
      </button>

      <button
  onClick={() =>
    setPage("tasks")
  }
>
  ✅ Tasks
</button>

      <button
  onClick={() =>
    setPage("pdfs")
  }
>
  📄 PDFs
</button>

      <VoiceButton />

      <p>⚙ Settings</p>

    </div>

  );
}