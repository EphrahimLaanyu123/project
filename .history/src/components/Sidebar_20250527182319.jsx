// src/components/BottomNavbar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // Import useLocation
import { Home, MessageCircle, ListTodo, Users } from 'lucide-react'; // Removed LayoutDashboard as it's less relevant for a bottom nav
import './Dashboard.css'; // This CSS file will now contain the bottom navbar styles

const BottomNavbar = ({ unreadMessages }) => {
    const location = useLocation(); // Get the current location

    // Helper function to determine if a link is active
    const isActive = (pathname) => {
        return location.pathname === pathname || 
               (pathname === "/dashboard/rooms" && location.pathname.startsWith("/rooms"));
    };

    return (
        <nav className="bottom-navbar">
            <ul className="bottom-navbar-nav-list">
                <li>
                    <Link to="/dashboard" className={`bottom-navbar-nav-item ${isActive("/dashboard") ? "active" : ""}`}>
                        <Home className="bottom-navbar-nav-icon" />
                        <span className="bottom-navbar-nav-text">Home</span>
                    </Link>
                </li>
                <li>
                    <Link to="/dashboard/rooms" className={`bottom-navbar-nav-item ${isActive("/dashboard/rooms") ? "active" : ""}`}>
                        <MessageCircle className="bottom-navbar-nav-icon" />
                        <span className="bottom-navbar-nav-text">Rooms</span>
                        {unreadMessages > 0 && (
                            <span className="unread-messages-badge">
                                {unreadMessages}
                            </span>
                        )}
                    </Link>
                </li>
                <li>
                    <Link to="/tasks" className={`bottom-navbar-nav-item ${isActive("/tasks") ? "active" : ""}`}>
                        <ListTodo className="bottom-navbar-nav-icon" />
                        <span className="bottom-navbar-nav-text">My Tasks</span>
                    </Link>
                </li>
                <li>
                    <Link to="/teams" className={`bottom-navbar-nav-item ${isActive("/teams") ? "active" : ""}`}>
                        <Users className="bottom-navbar-nav-icon" />
                        <span className="bottom-navbar-nav-text">Teams</span>
                    </Link>
                </li>
            </ul>
        </nav>
    );
};

export default BottomNavbar;