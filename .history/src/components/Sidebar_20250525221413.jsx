// src/components/Sidebar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Home, MessageCircle, ListTodo, Users } from 'lucide-react';
import './Sidebar.css'; // You'll create this CSS file

const Sidebar = ({ unreadMessages }) => {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <LayoutDashboard className="sidebar-icon" />
                <h2 className="sidebar-title">Dashboard</h2>
            </div>
            <nav>
                <ul className="sidebar-nav-list">
                    <li>
                        <Link to="/dashboard" className="sidebar-nav-item">
                            <Home className="sidebar-nav-icon" />
                            <span className="sidebar-nav-text">Home</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/rooms" className="sidebar-nav-item">
                            <MessageCircle className="sidebar-nav-icon" />
                            <span className="sidebar-nav-text">Rooms</span>
                            {unreadMessages > 0 && (
                                <span className="unread-messages-badge">
                                    {unreadMessages}
                                </span>
                            )}
                        </Link>
                    </li>
                    <li>
                        <Link to="/tasks" className="sidebar-nav-item">
                            <ListTodo className="sidebar-nav-icon" />
                            <span className="sidebar-nav-text">My Tasks</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/teams" className="sidebar-nav-item">
                            <Users className="sidebar-nav-icon" />
                            <span className="sidebar-nav-text">Teams</span>
                        </Link>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;