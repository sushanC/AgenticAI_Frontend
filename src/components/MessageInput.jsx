import {
  useState
} from "react";

export default function MessageInput({
  onSend
}) {

  const [text, setText] =
    useState("");

  function handleSend() {

    onSend(text);

    setText("");
  }

  return (

    <div
      style={{
        display: "flex",
        gap: "10px",
        padding: "10px"
      }}
    >

      <input
        value={text}

        onChange={e =>
          setText(
            e.target.value
          )
        }

        placeholder="Type a message..."

        style={{
          flex: 1,
          padding: "10px"
        }}
      />

      <button
        onClick={handleSend}
      >
        Send
      </button>

    </div>
  );
}