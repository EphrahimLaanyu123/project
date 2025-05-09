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

    // Subscribe to real-time updates
    const subscription = supabase
      .channel("realtime:chats")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chats" }, (payload) => {
        setMessages((prevMessages) => [...prevMessages, payload.new]);
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [roomId]);

  // Scroll to bottom when messages change
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
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md flex flex-col h-[80vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Chat Room</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-black text-xl"
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto mb-4 bg-gray-50 p-4 rounded border border-gray-200">
          {messages.length > 0 ? (
            <div className="space-y-2">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`p-2 rounded-lg ${
                    msg.user_id === user?.id 
                      ? 'bg-black text-white ml-auto' 
                      : 'bg-gray-200 text-black mr-auto'
                  } max-w-[80%] break-words`}
                >
                  <div className="font-semibold text-xs mb-1">
                    {msg.users?.username || 'Unknown user'}
                  </div>
                  <div>{msg.message}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="text-gray-500 italic text-center h-full flex items-center justify-center">
              No messages yet. Start the conversation!
            </div>
          )}
        </div>
        
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            required
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
          />
          <button 
            type="submit" 
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatRoom;