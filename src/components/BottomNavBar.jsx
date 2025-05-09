import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import { MessageCircle, Home } from "lucide-react";

const BottomNavBar = ({ unreadMessages }) => {
    return (
        <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white border border-gray-200 shadow-lg rounded-full py-2 px-6">
            <div className="flex justify-around items-center w-full">
                <Link
                    to="/rooms"
                    className="flex flex-col items-center text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
                >
                    <Home className="h-6 w-6 text-gray-700 mb-1 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm font-medium">Rooms</span>

                </Link>
                <Link
                    to="/messages"
                    className="flex flex-col items-center text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
                >
                    <MessageCircle className="h-6 w-6 text-gray-700 mb-1 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm font-medium">Messages</span>
                    {unreadMessages > 0 && (
                        <span className="text-xs font-semibold text-red-500">
                            {unreadMessages}
                        </span>
                    )}
                </Link>
            </div>
        </nav>
    );
};

export default BottomNavBar;
