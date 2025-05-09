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
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 p-4 flex items-center">
                <button
                    onClick={() => navigate(-1)}
                    className="mr-4 bg-transparent hover:bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded"
                >
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Rooms</h1>
            </header>

            {/* Room List */}
            <main className="flex-1 overflow-y-auto p-4">
                {rooms.length === 0 ? (
                    <div className="text-center text-gray-500">
                        <MessageCircle className="h-10 w-10 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600">You are not a member of any rooms yet.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {rooms.map((room) => (
                            <div
                                key={room.id}
                                className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100 hover:shadow-lg"
                                onClick={() => openChatRoom(room.id)}
                            >
                                <div className="flex-1">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-1">{room.name}</h2>
                                    <p className="text-gray-500 text-sm">{room.description}</p>
                                </div>
                                <ChevronRight className="h-6 w-6 text-gray-700 transition-transform transform group-hover:translate-x-2" />
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
