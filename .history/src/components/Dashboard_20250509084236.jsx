import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from "../supabase";
import { LogOut, UserCircle, MessageCircle, Home } from "lucide-react"; // Changed to Home icon
import "../App.css";

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();
    const [unreadMessages, setUnreadMessages] = useState(0);

    useEffect(() => {
        async function fetchUser() {
            setIsLoading(true);
            setErrorMessage("");

            const { data: authData, error: authError } = await supabase.auth.getUser();
            if (authError || !authData?.user) {
                setErrorMessage("Failed to get user information.");
                setIsLoading(false);
                return;
            }

            const userId = authData.user.id;
            setUser({ id: userId, email: authData.user.email });

            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("username")
                .eq("id", userId)
                .single();

            if (!userError && userData) {
                setUser({ id: userId, email: authData.user.email, username: userData.username });
            }


            // Fetch unread messages
            const { data: unreadData, error: unreadError } = await supabase
                .from("chats")
                .select("count(*)", { count: 'exact' })
                .eq("is_read", false)
                .neq("user_id", userId);

            if (unreadError) {
                console.error("Error fetching unread messages:", unreadError);
                setErrorMessage("Failed to fetch unread messages.");
            } else if (unreadData && unreadData[0]?.count) {
                setUnreadMessages(parseInt(unreadData[0].count, 10));
            }

            setIsLoading(false);
        }

        fetchUser();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };



    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="relative w-16 h-16">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-black rounded-full animate-spin border-t-transparent"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-10">
                <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Welcome back, {user?.username || "User"}
                    </h1>
                    {user && (
                        <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-3">
                                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-2 shadow-md">
                                    <UserCircle className="h-7 w-7 text-gray-700" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{user.username || "User"}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-2 shadow-md">
                                    <MessageCircle className="h-7 w-7 text-gray-700" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Messages</p>
                                    <p className="text-xs text-gray-500">{unreadMessages} Unread</p>
                                </div>
                            </div>
                            <button
                                onClick={signOut}
                                className="inline-flex items-center px-4 py-2 border-2 border-gray-900 text-sm font-medium rounded-lg text-gray-900 bg-transparent hover:bg-gray-900 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg py-2 px-4">
                <div className="flex justify-around items-center">
                    <Link
                        to="/rooms"
                        className="flex flex-col items-center text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
                    >
                        <Home className="h-6 w-6 text-gray-700 mb-1 group-hover:scale-110 transition-transform duration-200" /> {/* Changed to Home */}
                        <span className="text-sm font-medium">Rooms</span>
                        {unreadMessages > 0 && (
                            <span className="text-xs font-semibold text-red-500">
                                {unreadMessages}
                            </span>
                        )}
                    </Link>
                </div>
            </nav>
        </div>
    );
};

export default Dashboard;
