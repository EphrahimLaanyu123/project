// src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { supabase } from "../supabase";
import BottomNavBar from "./BottomNavBar";
import Sidebar from "./Sidebar"; // Import Sidebar
import Header from "./Header";   // Import Header
import MainContent from "./MainContent"; // Import MainContent
import './Dashboard.css'; // Your existing Dashboard CSS


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
            <Sidebar unreadMessages={unreadMessages} />
            <div className="main-content-wrapper">
                <Header user={user} signOut={signOut} />
                <MainContent
                    user={user}
                    assignedTasks={assignedTasks}
                    taskCounts={taskCounts}
                    handleTaskClick={handleTaskClick}
                />
                <BottomNavBar />
            </div>
        </div>
    );
};

export default Dashboard;