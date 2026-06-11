export default function ChatWindow({
  messages
}) {

  return (

    <div
      style={{
        flex: 1,
        padding: "20px",
        overflowY: "auto"
      }}
    >

      <h2>Chat</h2>

      {messages.map(
        (msg, index) => (

          <div
            key={index}
            style={{
              marginBottom: "15px"
            }}
          >

            <strong>

              {msg.role === "user"
                ? "You"
                : "AI"}

              :

            </strong>

            {" "}

            {msg.content}

          </div>
        )
      )}

    </div>
  );
}