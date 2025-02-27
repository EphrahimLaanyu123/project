import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";

function ChatRoom({ roomId, user, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

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

    const subscription = supabase
      .channel("realtime:chats")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chats" },
        (payload) => {
          setMessages((prevMessages) => [...prevMessages, payload.new]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await supabase.from("chats").insert([{ room_id: roomId, user_id: user.id, message: newMessage }]);
    setNewMessage("");
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Chat Room</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-100 space-y-2">
          {messages.length > 0 ? (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  msg.user_id === user?.id ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-2 rounded-lg ${
                    msg.user_id === user?.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  <div className="text-xs font-semibold mb-1">
                    {msg.users?.username || "Unknown"}
                  </div>
                  <div className="break-words">{msg.message}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500 italic text-center py-4">
              No messages yet.
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            required
            className="flex-1 border rounded-l-md p-2 focus:outline-none focus:ring focus:border-blue-300"
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-r-md px-4 focus:outline-none focus:ring focus:border-blue-300"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatRoom;