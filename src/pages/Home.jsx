import { useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import MessageInput from "../components/MessageInput";

export default function Home() {

  const [messages, setMessages] =
    useState([]);

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

      <Sidebar />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column"
        }}
      >

        <ChatWindow
          messages={messages}
        />

        <MessageInput
          onSend={sendMessage}
        />

      </div>

    </div>

  );
}