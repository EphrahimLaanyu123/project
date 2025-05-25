import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from "../supabase";
import { LogOut, UserCircle, LayoutDashboard, CheckCircle2, MessageCircle, Home, ListTodo, Users } from "lucide-react";
import BottomNavBar from "./BottomNavBar";
import './Dashboard.css';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();
    const [assignedTasks, setAssignedTasks] = useState([]);
    const [unreadMessages, setUnreadMessages] = useState(0);
    // New state for task counts
    const [taskCounts, setTaskCounts] = useState({
        completed: 0,
        toDo: 0,
        inProgress: 0,
        blocked: 0, // Include blocked tasks in counts
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

                // Calculate task counts
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

                        {/* Welcome message for the user */}
                        <div className="welcome-section">
                            <h2 className="welcome-title">
                                Welcome, <span className="welcome-username">{user?.username || "User"}</span>!
                            </h2>
                            <p className="welcome-text">Here's a quick overview of your projects and tasks.</p>
                        </div>

                        {/* New Section: Task Status Summary Cards */}
                        <h2 className="tasks-section-title">Task Summary</h2>
                        <div className="task-summary-grid">
                            <div className="summary-card total-tasks">
                                <p className="summary-card-label">Total Tasks</p>
                                <span className="summary-card-count">{taskCounts.total}</span>
                            </div>
                            <div className="summary-card completed-tasks">
                                <p className="summary-card-label">Completed</p>
                                <span className="summary-card-count">{taskCounts.completed}</span>
                            </div>
                            <div className="summary-card todo-tasks">
                                <p className="summary-card-label">To Do</p>
                                <span className="summary-card-count">{taskCounts.toDo}</span>
                            </div>
                            <div className="summary-card in-progress-tasks">
                                <p className="summary-card-label">In Progress</p>
                                <span className="summary-card-count">{taskCounts.inProgress}</span>
                            </div>
                             <div className="summary-card blocked-tasks">
                                <p className="summary-card-label">Blocked</p>
                                <span className="summary-card-count">{taskCounts.blocked}</span>
                            </div>
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