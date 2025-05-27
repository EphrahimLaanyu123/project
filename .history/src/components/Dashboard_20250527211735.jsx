// src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Routes, Route, Outlet } from 'react-router-dom'; // Import Routes, Route, and Outlet
import { supabase } from "../supabase";
import BottomNavBar from "./BottomNavBar";
import Sidebar from "./Sidebar";
import Header from "./Header";
// Import the components that will be rendered inside the Dashboard's Outlet
import Rooms from "./Rooms"; // Your Rooms component
import RoomDetail from "./RoomDetail"; // Your RoomDetail component
import CalendarComponent from "./Calendar"; // Your Calendar component
// Import other components you might want to render inside the dashboard, e.g., Tasks, Teams
import MainContent from "./MainContent";
import MyTasks from "./MyTasks";


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

    // This handleTaskClick assumes it's navigating to a room detail page
    const handleTaskClick = (roomId) => {
        // Correct path for nested routing: relative to the dashboard route
        navigate(`rooms/${roomId}`);
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
            {/* Sidebar is always present */}
            <Sidebar unreadMessages={unreadMessages} />

            <div className="main-content-wrapper">
                {/* Header is always present */}
                <Header user={user} signOut={signOut} />

                {/* The main content area where nested routes will render */}
                <main className="main-content">
                    <div className="max-width-container">
                        <Routes>
                            {/* The index route renders when the path is exactly /dashboard */}
                            <Route index element={
                                <MainContent
                                    user={user}
                                    assignedTasks={assignedTasks}
                                    taskCounts={taskCounts}
                                    handleTaskClick={handleTaskClick}
                                />
                            } />
                            {/* Route for Rooms, will replace DashboardContent */}
                            <Route path="rooms" element={<Rooms />} />
                            {/* Route for RoomDetail, nested under rooms */}
                            <Route path="rooms/:roomId" element={<RoomDetail />} />
                            {/* Route for Calendar */}
                            <Route path="calendar" element={<CalendarComponent />} />
                            <Route path="tasks" element={<my />} />


                        </Routes>

                    </div>
                </main>

            </div>
        </div>
    );
};

export default Dashboard;