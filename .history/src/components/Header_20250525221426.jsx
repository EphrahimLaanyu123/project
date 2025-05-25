// src/components/Header.jsx
import React from 'react';
import { UserCircle, LogOut } from 'lucide-react';
import './Header.css'; // You'll create this CSS file

const Header = ({ user, signOut }) => {
    return (
        <header className="main-header">
            <div className="main-header-content">
                <h1 className="main-header-title">
                    Overview of all projects
                </h1>
                {user && (
                    <div className="user-actions-container">
                        <div className="user-profile-info">
                            <div className="user-profile-icon-wrapper">
                                <UserCircle className="user-profile-icon" />
                            </div>
                            <div>
                                <p className="user-profile-username">{user.username || "User"}</p>
                                <p className="user-profile-email">{user.email}</p>
                            </div>
                        </div>
                        <button onClick={signOut} className="sign-out-button">
                            <LogOut className="sign-out-icon" />
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;