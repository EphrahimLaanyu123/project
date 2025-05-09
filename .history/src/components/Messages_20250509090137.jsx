import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { MessageCircle, ArrowLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChatRoom from './ChatRoom'; // Import ChatRoom component

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
            <div className="flex items-center justify-center h-screen bg-gradient-to-b from-gray-50 to-gray-100">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                    <p className="mt-4 text-sm font-medium text-gray-600">Loading your conversations...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-b from-gray-50 to-gray-100">
                <div className="bg-white border-l-4 border-red-500 shadow-lg rounded-lg p-6 max-w-md">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 text-red-500">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-lg font-semibold text-gray-900">Error</h3>
                            <p className="mt-1 text-sm text-gray-600">{error}</p>
                        </div>
                    </div>
                    <button 
                        className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm backdrop-blur-sm bg-opacity-90 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <button
                                onClick={() => navigate(-1)}
                                className="inline-flex items-center justify-center rounded-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                                aria-label="Go back"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <h1 className="ml-4 text-xl font-semibold text-gray-900">Conversations</h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Room List */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {rooms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="bg-indigo-50 p-4 rounded-full">
                                <MessageCircle className="h-10 w-10 text-indigo-500" />
                            </div>
                            <h3 className="mt-6 text-lg font-medium text-gray-900">No conversations yet</h3>
                            <p className="mt-2 text-center text-sm text-gray-500 max-w-md">
                                You are not a member of any rooms. Create a new room or join an existing one to start chatting.
                            </p>
                            <button
                                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                            >
                                Create a Room
                            </button>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {rooms.map((room) => (
                                <li key={room.id}>
                                    <button
                                        className="w-full text-left focus:outline-none transition-all duration-200 transform hover:translate-x-1"
                                        onClick={() => openChatRoom(room.id)}
                                    >
                                        <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 transition-all duration-200">
                                            <div className="p-5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <h2 className="text-lg font-semibold text-gray-900 truncate">{room.name}</h2>
                                                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{room.description}</p>
                                                    </div>
                                                    <div className="flex-shrink-0 ml-4">
                                                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors duration-200">
                                                            <ChevronRight className="h-5 w-5" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </main>
            {selectedRoomId && user && (
                <ChatRoom
                    roomId={selectedRoomId}
                    user={user}
                    onClose={closeChatRoom}
                />
            )}
        </div>
        <
    );
};

export default Messages;