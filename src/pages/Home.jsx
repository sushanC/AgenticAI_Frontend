import { useState } from "react";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import MessageInput from "../components/MessageInput";

import NotesPanel from "../components/NotesPanel";
import TasksPanel from "../components/TasksPanel";
import PDFPanel from "../components/PDFPanel";

export default function Home() {

  const [messages, setMessages] =
    useState([]);

  const [page, setPage] =
    useState("chat");

  async function sendMessage(
    text
  ) {

    if (!text.trim())
      return;

    const userMessage = {
      role: "user",
      content: text
    };

    setMessages(prev => [
      ...prev,
      userMessage
    ]);

    try {

      const response =
        await axios.post(
          "http://localhost:3001/chat",
          {
            message: text
          }
        );

      const aiMessage = {
        role: "assistant",
        content:
          response.data.reply
      };

      setMessages(prev => [
        ...prev,
        aiMessage
      ]);

    } catch {

      setMessages(prev => [
        ...prev,
        {
          role:
            "assistant",
          content:
            "Error contacting AI"
        }
      ]);
    }
  }

  return (

    <div
      style={{
        width: "100vw",
        height: "100vh",

        display: "flex",

        background:
          `
          radial-gradient(
            circle at top left,
            rgba(99,102,241,.25),
            transparent 35%
          ),

          radial-gradient(
            circle at bottom right,
            rgba(139,92,246,.20),
            transparent 35%
          ),

          #0B0F19
          `,

        overflow: "hidden"
      }}
    >

      <Sidebar
        setPage={setPage}
      />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          height: "100vh",

          padding: "16px",

          display: "flex",
          flexDirection: "column"
        }}
      >

        <div
          style={{
            flex: 1,
            minWidth: 0,

            display: "flex",
            flexDirection: "column",

            background:
              "rgba(255,255,255,0.03)",

            backdropFilter:
              "blur(24px)",

            border:
              "1px solid rgba(255,255,255,0.08)",

            borderRadius:
              "28px",

            overflow: "hidden",

            boxShadow:
              "0 25px 60px rgba(0,0,0,.35)"
          }}
        >

          {
            page === "notes"

              ? <NotesPanel />

            : page === "tasks"

              ? <TasksPanel />

            : page === "pdfs"

              ? <PDFPanel />

            : <ChatWindow
                messages={messages}
              />
          }

          <MessageInput
            onSend={sendMessage}
          />

        </div>

      </div>

    </div>
  );
}