import { useState, useEffect } from "react";
import { supabase } from "../supabase";

function ChatRoom({ roomId, user, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    async function fetchMessages() {
      const { data, error } = await supabase
        .from("chats")
        .select("message, created_at, user_id, users(username)")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (!error) setMessages(data);
    }

    fetchMessages();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel("realtime:chats")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chats" }, (payload) => {
        setMessages((prevMessages) => [...prevMessages, payload.new]);
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [roomId]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await supabase.from("chats").insert([{ room_id: roomId, user_id: user.id, message: newMessage }]);
    setNewMessage("");
  }

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={styles.title}>Chat Room</h3>
        <button style={styles.closeButton} onClick={onClose}>×</button>
        <div style={styles.chatMessages}>
          {messages.map((msg, index) => (
            <p key={index} style={styles.message}>
              <strong style={styles.username}>{msg.users?.username}:</strong> {msg.message}
            </p>
          ))}
        </div>
        <form style={styles.form} onSubmit={sendMessage}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            required
            style={styles.input}
          />
          <button type="submit" style={styles.sendButton}>Send</button>
        </form>
      </div>
    </div>
  );
}

export default ChatRoom;
const styles = {
  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "10px",
    width: "90%",
    maxWidth: "400px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  title: {
    textAlign: "center",
    marginBottom: "10px",
    fontSize: "18px",
    fontWeight: "bold",
  },
  closeButton: {
    position: "absolute",
    top: "10px",
    right: "10px",
    border: "none",
    backgroundColor: "transparent",
    fontSize: "18px",
    cursor: "pointer",
  },
  chatMessages: {
    maxHeight: "300px",
    overflowY: "auto",
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ddd",
    backgroundColor: "#f9f9f9",
    marginBottom: "10px",
  },
  message: {
    padding: "5px",
    margin: "5px 0",
    backgroundColor: "#e6e6e6",
    borderRadius: "5px",
  },
  username: {
    color: "#007bff",
  },
  form: {
    display: "flex",
    gap: "10px",
  },
  input: {
    flex: 1,
    padding: "8px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  sendButton: {
    padding: "8px 12px",
    border: "none",
    backgroundColor: "#007bff",
    color: "#fff",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default ChatRoom;
