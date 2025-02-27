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
    <div className="modal">
      <h3>Chat Room</h3>
      <button onClick={onClose}>Close</button>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <p key={index}><strong>{msg.users?.username}:</strong> {msg.message}</p>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." required />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default ChatRoom;
