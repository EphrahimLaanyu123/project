import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { X, Send, AlertTriangle, UserCircle } from "lucide-react";

function ChatRoom({ roomId, user, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function fetchMessages() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("chats")
        .select("*, users(username)")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (error) {
        setErrorMessage("Failed to load chat messages");
      } else {
        setMessages(data || []);
      }
      setIsLoading(false);
    }

    fetchMessages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "chats",
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          // Fetch the complete message with user info
          fetchNewMessage(payload.new.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Fetch a single new message with user info
  async function fetchNewMessage(messageId) {
    const { data, error } = await supabase
      .from("chats")
      .select("*, users(username)")
      .eq("id", messageId)
      .single();

    if (!error && data) {
      setMessages(prev => [...prev, data]);
    }
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  async function sendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { error } = await supabase.from("chats").insert([{ 
      room_id: roomId, 
      user_id: user.id, 
      message: newMessage 
    }]);

    if (error) {
      setErrorMessage("Failed to send message");
    } else {
      setNewMessage("");
    }
  }

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check if message is from current user
  const isOwnMessage = (messageUserId) => {
    return user && messageUserId === user.id;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 flex flex-col h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Chat Room</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {errorMessage && (
          <div className="mx-6 mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
            </div>
          ) : messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div 
                  key={msg.id || index} 
                  className={`flex ${isOwnMessage(msg.user_id) ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwnMessage(msg.user_id) 
                        ? 'bg-black text-white rounded-br-none' 
                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    {!isOwnMessage(msg.user_id) && (
                      <div className="flex items-center mb-1">
                        <UserCircle className="h-4 w-4 mr-1 text-gray-500" />
                        <span className="text-xs font-medium">
                          {msg.users?.username || "User"}
                        </span>
                      </div>
                    )}
                    <p className="text-sm">{msg.message}</p>
                    <div className={`text-xs mt-1 ${isOwnMessage(msg.user_id) ? 'text-gray-300' : 'text-gray-500'}`}>
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Be the first to send a message!</p>
            </div>
          )}
        </div>
        
        <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-white">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 shadow-sm focus:ring-black focus:border-black block w-full sm:text-sm border-gray-300 rounded-md"
              required
            />
            <button
              type="submit"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-black shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatRoom;