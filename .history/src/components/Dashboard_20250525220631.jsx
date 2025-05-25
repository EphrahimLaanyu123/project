import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from "../supabase";
import { LogOut, UserCircle, LayoutDashboard, CheckCircle2, MessageCircle, Home, ListTodo, Users } from "lucide-react";
import BottomNavBar from "./BottomNavBar";
import DashboardHomeContent from './DashboardHomeContent'; // Import the new component
import './Dashboard.css';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();
    const [assignedTasks, setAssignedTasks] = useState([]);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [taskCounts, setTaskCounts] = useState({
        completed: 0,
        toDo: 0,
        inProgress: 0,
        blocked: 0,
        total: 0,
    });

    useEffect(() => {
        async function fetchUser() {
            setIsLoading(true);
            setErrorMessage("");

            const { data: authData, error: authError } = await supabase.auth.getUser();
            if (authError || !authData?.user) {
                setErrorMessage("Failed to get user information. Please log in again.");
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
                setUser(prevUser => ({ ...prevUser, username: userData.username }));
            } else if (userError) {
                console.error("Error fetching user profile:", userError);
            }

            const { data: taskData, error: taskError } = await supabase
                .from("task_members")
                .select("task_id, tasks(id, content, status, priority, room_id)")
                .eq("user_id", userId)
                .in("tasks.status", ['To Do', 'In Progress', 'Completed', 'Blocked']);

            if (taskError) {
                console.error("Error fetching assigned tasks:", taskError);
                setErrorMessage("Failed to fetch your assigned tasks.");
            } else if (taskData) {
                const tasks = taskData.map(item => ({
                    ...item.tasks,
                    toDo: item.tasks.status,
                }));
                setAssignedTasks(tasks);

                const counts = {
                    completed: 0,
                    toDo: 0,
                    inProgress: 0,
                    blocked: 0,
                    total: tasks.length,
                };

                tasks.forEach(task => {
                    if (task.status === "Completed") {
                        counts.completed++;
                    } else if (task.status === "To Do") {
                        counts.toDo++;
                    } else if (task.status === "In Progress") {
                        counts.inProgress++;
                    } else if (task.status === "Blocked") {
                        counts.blocked++;
                    }
                });
                setTaskCounts(counts);
            }

            const { data: unreadData, error: unreadError } = await supabase
                .from("chats")
                .select("count(*)", { count: 'exact' })
                .eq("is_read", false)
                .neq("user_id", userId);

            if (unreadError) {
                console.error("Error fetching unread messages:", unreadError);
                setErrorMessage("Failed to fetch unread messages count.");
            } else if (unreadData && unreadData[0]?.count) {
                setUnreadMessages(parseInt(unreadData[0].count, 10));
            }

            setIsLoading(false);
        }

        fetchUser();
    }, []);

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
            navigate("/");
        } catch (error) {
            console.error("Error signing out:", error);
            setErrorMessage("Failed to sign out. Please try again.");
        }
    };

    const handleTaskClick = (roomId) => {
        navigate(`/rooms/${roomId}`);
    };

    if (isLoading) {
        return (
            <div className="loading-spinner-container">
                <div className="loading-spinner">
                    <div className="loading-spinner-inner-border"></div>
                    <div className="loading-spinner-outer-border"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Sidebar remains here */}
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
                            <Link to="/dashboard/rooms" className="sidebar-nav-item"> {/* Updated path */}
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
                            <Link to="/dashboard/tasks" className="sidebar-nav-item"> {/* Updated path */}
                                <ListTodo className="sidebar-nav-icon" />
                                <span className="sidebar-nav-text">My Tasks</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/dashboard/teams" className="sidebar-nav-item"> {/* Updated path */}
                                <Users className="sidebar-nav-icon" />
                                <span className="sidebar-nav-text">Teams</span>
                            </Link>
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* Main Content Wrapper */}
            <div className="main-content-wrapper">
                {/* Header remains here */}
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

                {/* Main Content where child routes will render */}
                <main className="main-content">
                    <div className="max-width-container">
                        {/* The Outlet is where the content of the child routes will appear */}
                        {/* We pass props to the DashboardHomeContent component if it's rendered by the index route */}
                        <Outlet context={{ user, assignedTasks, taskCounts, handleTaskClick }} />
                    </div>
                </main>
                <BottomNavBar></BottomNavBar>
            </div>
        </div>
    );
};

export default Dashboard;