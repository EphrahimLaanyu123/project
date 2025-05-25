import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from "../supabase"; // Assuming supabase is correctly configured and imported
import { LogOut, UserCircle, LayoutDashboard, CheckCircle2, MessageCircle, Home, ListTodo, Users } from "lucide-react"; // Import Lucide icons
import BottomNavBar from "./BottomNavBar"; // Assuming BottomNavBar is correctly configured and imported
import './Dashboard.css'; // Import the new CSS file

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();
    const [assignedTasks, setAssignedTasks] = useState([]);
    const [unreadMessages, setUnreadMessages] = useState(0);

    useEffect(() => {
        /**
         * Fetches user data, assigned tasks, and unread messages from Supabase.
         * Handles loading states and error messages.
         */
        async function fetchUser() {
            setIsLoading(true);
            setErrorMessage("");

            // Fetch authenticated user data
            const { data: authData, error: authError } = await supabase.auth.getUser();
            if (authError || !authData?.user) {
                setErrorMessage("Failed to get user information. Please log in again.");
                setIsLoading(false);
                return;
            }

            const userId = authData.user.id;
            // Set initial user state with ID and email
            setUser({ id: userId, email: authData.user.email });

            // Fetch additional user details (username) from the 'users' table
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("username")
                .eq("id", userId)
                .single();

            if (!userError && userData) {
                // Update user state with username if available
                setUser(prevUser => ({ ...prevUser, username: userData.username }));
            } else if (userError) {
                console.error("Error fetching user profile:", userError);
                // Continue without username if there's an error, but log it
            }

            // Fetch tasks assigned to the user
            const { data: taskData, error: taskError } = await supabase
                .from("task_members")
                .select("task_id, tasks(id, content, status, priority, room_id)") // Join with tasks table
                .eq("user_id", userId)
                .in("tasks.status", ['To Do', 'In Progress', 'Completed', 'Blocked']); // Filter by relevant statuses

            if (taskError) {
                console.error("Error fetching assigned tasks:", taskError);
                setErrorMessage("Failed to fetch your assigned tasks.");
            } else if (taskData) {
                // Map and format the fetched task data
                const tasks = taskData.map(item => ({
                    ...item.tasks,
                    toDo: item.tasks.status, // Rename status to toDo for consistency with existing logic
                }));
                setAssignedTasks(tasks);
            }

            // Fetch unread messages count
            const { data: unreadData, error: unreadError } = await supabase
                .from("chats")
                .select("count(*)", { count: 'exact' })
                .eq("is_read", false)  // Only count unread messages
                .neq("user_id", userId); // Exclude messages sent by the current user

            if (unreadError) {
                console.error("Error fetching unread messages:", unreadError);
                setErrorMessage("Failed to fetch unread messages count.");
            } else if (unreadData && unreadData[0]?.count) {
                setUnreadMessages(parseInt(unreadData[0].count, 10));
            }

            setIsLoading(false);
        }

        fetchUser();
    }, []); // Empty dependency array means this effect runs once on mount

    /**
     * Handles user sign out and navigates to the home page.
     */
    const signOut = async () => {
        try {
            await supabase.auth.signOut();
            navigate("/"); // Navigate to the root path after sign out
        } catch (error) {
            console.error("Error signing out:", error);
            setErrorMessage("Failed to sign out. Please try again.");
        }
    };

    /**
     * Navigates to the specific room when a task card is clicked.
     * @param {string} roomId - The ID of the room associated with the task.
     */
    const handleTaskClick = (roomId) => {
        navigate(`/rooms/${roomId}`);
    };

    // Display a loading spinner while data is being fetched
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
            {/* Sidebar */}
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

            {/* Main Content Wrapper */}
            <div className="main-content-wrapper">
                {/* Header */}
                <header className="main-header">
                    <div className="main-header-content">
                        <h1 className="main-header-title">
                            Overview of all projects
                        </h1>
                        {user && (
                            <div className="user-actions-container">
                                {/* User Profile Info */}
                                <div className="user-profile-info">
                                    <div className="user-profile-icon-wrapper">
                                        <UserCircle className="user-profile-icon" />
                                    </div>
                                    <div>
                                        <p className="user-profile-username">{user.username || "User"}</p>
                                        <p className="user-profile-email">{user.email}</p>
                                    </div>
                                </div>

                                {/* Sign Out Button */}
                                <button onClick={signOut} className="sign-out-button">
                                    <LogOut className="sign-out-icon" />
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Main Content */}
                <main className="main-content">
                    <div className="max-width-container">
                        {errorMessage && (
                            <div className="error-message-alert" role="alert">
                                <p className="error-message-title">Error</p>
                                <p>{errorMessage}</p>
                            </div>
                        )}

                        {/* Welcome message for the user */}
                        <div className="welcome-section">
                            <h2 className="welcome-title">
                                Welcome, <span className="welcome-username">{user?.username || "User"}</span>!
                            </h2>
                            <p className="welcome-text">Here's a quick overview of your projects and tasks.</p>
                        </div>

                        <h2 className="tasks-section-title">Your Assigned Tasks</h2>
                        {assignedTasks.length > 0 ? (
                            <div className="tasks-grid">
                                {assignedTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="task-card"
                                        onClick={() => handleTaskClick(task.room_id)}
                                    >
                                        <h3 className="task-card-title">{task.content}</h3>
                                        <div className="task-card-detail">
                                            <p className="task-card-label">Status:</p>
                                            <span
                                                className={`task-status-badge ${task.toDo === "Completed"
                                                    ? "status-completed"
                                                    : task.toDo === "In Progress"
                                                        ? "status-in-progress"
                                                        : task.toDo === "Blocked"
                                                            ? "status-blocked"
                                                            : "status-default"
                                                    }`}
                                            >
                                                {task.toDo}
                                            </span>
                                        </div>
                                        <div className="task-card-detail">
                                            <p className="task-card-label">Priority:</p>
                                            <span
                                                className={`task-priority-badge ${task.priority === "urgent"
                                                    ? "priority-urgent"
                                                    : task.priority === "high"
                                                        ? "priority-high"
                                                        : task.priority === "medium"
                                                            ? "priority-medium"
                                                            : "priority-low"
                                                    }`}
                                            >
                                                {task.priority}
                                            </span>
                                        </div>
                                        {task.toDo === "Completed" && (
                                            <div className="task-completed-indicator">
                                                <CheckCircle2 className="task-completed-icon" />
                                                Task Completed
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-tasks-alert" role="alert">
                                <p className="no-tasks-title">No tasks assigned to you!</p>
                                <p className="no-tasks-text">It looks like you currently don't have any tasks. Keep up the great work!</p>
                            </div>
                        )}
                        <Outlet /> {/* Renders child routes */}
                    </div>
                </main>
                {/* Bottom Navigation Bar for Mobile */}
                <BottomNavBar></BottomNavBar>
            </div>
        </div>
    );
};

export default Dashboard;
