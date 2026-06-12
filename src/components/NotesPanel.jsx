import {
  useState,
  useEffect
} from "react";

import axios from "axios";

export default function NotesPanel() {

  const [notes, setNotes] =
    useState([]);

  const [page, setPage] =
  useState("chat");  

  const [text, setText] =
    useState("");

  async function loadNotes() {

    const response =
      await axios.get(
        "http://localhost:3001/notes"
      );

    setNotes(
      response.data
    );
  }

  async function saveNote() {

    if (!text.trim())
      return;

    await axios.post(
      "http://localhost:3001/notes",
      {
        content: text
      }
    );

    setText("");

    loadNotes();
  }

  useEffect(() => {

    loadNotes();

  }, []);

  return (

    <div
      style={{
        padding: "20px"
      }}
    >

      <h2>
        Notes
      </h2>

      <input
        value={text}

        onChange={e =>
          setText(
            e.target.value
          )
        }

        placeholder="Write note..."
      />

      <button
        onClick={saveNote}
      >
        Save
      </button>

      <hr />

      {notes.map(note => (

        <div
          key={note.id}
        >

          {note.content}

        </div>

      ))}

    </div>
  );
}