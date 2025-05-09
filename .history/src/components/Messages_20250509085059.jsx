import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { MessageCircle, ArrowLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Messages = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

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

                // Fetch rooms where the user is a member
                const { data, error: roomsError } = await supabase
                    .from('room_members')
                    .select('room_id, rooms(id, name, description)')
                    .eq('user_id', authData.user.id);

                if (roomsError) {
                    setError("Failed to fetch rooms.");
                    setLoading(false);
                    return;
                }

                if (data) {
                    // Extract room details from the nested 'rooms' object
                    const roomList = data.map(item => item.rooms);
                    setRooms(roomList);
                }


            } catch (err) {
                setError("An unexpected error occurred.");
                setLoading(false);
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
    }, []);



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
                                onClick={() => navigate(`/chat/${room.id}`)} // Navigate to chat room
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
        </div>
    );
};

export default Messages;
