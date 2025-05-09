import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';

const Messages = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMessages = async () => {
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

                const { data, error: messagesError } = await supabase
                    .from('chats')
                    .select(`
                        id,
                        room_id,
                        user_id,
                        message,
                        created_at,
                        users ( username )
                    `)
                    .eq('user_id', authData.user.id)
                    .order('created_at', { ascending: true });

                if (messagesError) {
                    setError("Failed to fetch messages.");
                    setLoading(false);
                    return;
                }

                if (data) {
                    setMessages(data);
                }


            } catch (err) {
                setError("An unexpected error occurred.");
                setLoading(false);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, []);

    const formatTimestamp = (timestamp) => {
        try {
            return formatDistanceToNow(new Date(timestamp), {
                locale: enUS,
                addSuffix: true,
            });
        } catch (e) {
            console.error("Error formatting timestamp", e);
            return "Invalid Date";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Loading messages...</p>
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
                <h1 className="text-xl font-semibold">Messages</h1>
            </header>

            {/* Message List */}
            <main className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500">
                        <MessageCircle className="h-10 w-10 mx-auto mb-2" />
                        <p>No messages yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex flex-col ${message.user_id === user?.id ? 'items-end' : 'items-start'}`}
                            >
                                <div
                                    className={`rounded-lg py-2 px-3 max-w-[70%] ${message.user_id === user?.id
                                        ? 'bg-blue-500 text-white ml-auto'
                                        : 'bg-gray-200 text-gray-900 mr-auto'
                                        }`}
                                >
                                    <p className="text-sm">{message.message}</p>
                                </div>
                                 <p className={`text-xs text-gray-500 ${message.user_id === user?.id ? 'text-right' : 'text-left'}`}>
                                        {message.users?.username || 'Unknown User'} - {formatTimestamp(message.created_at)}
                                    </p>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Messages;
