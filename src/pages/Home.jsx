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

  if (!text.trim()) return;

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
        display: "flex",
        height: "100vh"
      }}
    >

      <Sidebar
  setPage={setPage}
/>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column"
        }}
      >

{
  page === "notes"
    ? <NotesPanel />

  : page === "tasks"
    ? <TasksPanel />

  : page === "pdfs"
    ? <PDFPanel/>

  : <ChatWindow
      messages={messages}
    />

}

        <MessageInput
          onSend={sendMessage}
        />

      </div>

    </div>

  );
}