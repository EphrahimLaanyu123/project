import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabase';
import { MessageCircle, ArrowLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
                                    className={`p-2 rounded-lg ${msg.user_id === user?.id
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


const Messages = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [selectedRoomId, setSelectedRoomId] = useState(null);

    useEffect(() => {
        const fetchRooms = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data: authData, error: authError } = await supabase.auth.getUser();
                if (authError || !authData?.user) {
                    setError("Failed to authenticate user.");
                    setLoading(false);
                    return;
                }
                setUser(authData.user);

                // Fetch rooms created by the logged-in user OR rooms the user has joined.
                const { data: createdRooms, error: createdRoomsError } = await supabase
                    .from('rooms')
                    .select('*')
                    .eq('created_by', authData.user.id);

                if (createdRoomsError) {
                    setError("Failed to fetch created rooms.");
                    setLoading(false);
                    return;
                }

                const { data: joinedRooms, error: joinedRoomsError } = await supabase
                    .from('room_members')
                    .select('room_id, rooms(*)')
                    .eq('user_id', authData.user.id);

                if (joinedRoomsError) {
                    setError("Failed to fetch joined rooms.");
                    setLoading(false);
                    return;
                }

                // Combine created and joined rooms, removing duplicates
                let allRooms = [...createdRooms];
                joinedRooms.forEach(joinedRoom => {
                    const roomExists = allRooms.some(room => room.id === joinedRoom.rooms.id);
                    if (!roomExists) {
                        allRooms.push(joinedRoom.rooms);
                    }
                });
                setRooms(allRooms);


            } catch (err) {
                setError("An unexpected error occurred.");
                setLoading(false);
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
    }, []);

    const openChatRoom = (roomId) => {
        setSelectedRoomId(roomId);
    };

    const closeChatRoom = () => {
        setSelectedRoomId(null);
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Loading rooms...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 p-4 flex items-center">
                <button onClick={() => navigate(-1)} className="mr-4">
                    <ArrowLeft className="h-6 w-6 text-gray-700" />
                </button>
                <h1 className="text-xl font-semibold">Rooms</h1>
            </header>

            {/* Room List */}
            <main className="flex-1 overflow-y-auto p-4">
                {rooms.length === 0 ? (
                    <div className="text-center text-gray-500">
                        <MessageCircle className="h-10 w-10 mx-auto mb-2" />
                        <p>You are not a member of any rooms yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {rooms.map((room) => (
                            <div
                                key={room.id}
                                className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => openChatRoom(room.id)} // Open chat room modal
                            >
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">{room.name}</h2>
                                    <p className="text-gray-500 text-sm">{room.description}</p>
                                </div>
                                <ChevronRight className="h-6 w-6 text-gray-700" />
                            </div>
                        ))}
                    </div>
                )}
            </main>
            {selectedRoomId && user && (
                <ChatRoom
                    roomId={selectedRoomId}
                    user={user}
                    onClose={closeChatRoom}
                />
            )}
        </div>
    );
};

export default Messages;
