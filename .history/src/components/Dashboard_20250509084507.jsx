import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from "../supabase";
import { LogOut, UserCircle, LayoutDashboard, CheckCircle2, MessageCircle } from "lucide-react";
import BottomNavBar from "./BottomNavBar";
import "../App.css";

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();
    const [assignedTasks, setAssignedTasks] = useState([]);
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

            // Fetch tasks assigned to the user
            const { data: taskData, error: taskError } = await supabase
                .from("task_members")
                .select("task_id, tasks(id, content, status, priority, room_id)") // Join with the tasks table and get room_id
                .eq("user_id", userId)
                .in("tasks.status", ['To Do', 'In Progress', 'Completed', 'Blocked']); // Filter by valid statuses

            if (taskError) {
                console.error("Error fetching assigned tasks:", taskError);
                setErrorMessage("Failed to fetch your assigned tasks.");
            } else if (taskData) {
                // Extract and format the task data
                const tasks = taskData.map(item => ({
                    ...item.tasks,
                    toDo: item.tasks.status, // Rename status to toDo
                }));
                setAssignedTasks(tasks);
            }

            // Fetch unread messages
            const { data: unreadData, error: unreadError } = await supabase
                .from("chats")
                .select("count(*)", { count: 'exact' })
                .eq("is_read", false)  // Add this line
                .neq("user_id", userId); //and this line

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

    const handleTaskClick = (roomId) => {
        navigate(`/rooms/${roomId}`);
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
        <div className="dashboard flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-gray-200 shadow-lg fixed h-full transition-all duration-300 ease-in-out">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-8">
                        <LayoutDashboard className="h-8 w-8 text-black" />
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
                            Dashboard
                        </h2>
                    </div>
                    <nav>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    to="/rooms"
                                    className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
                                >
                                    <span className="text-lg font-medium group-hover:translate-x-1 transition-transform duration-200">
                                        Rooms
                                    </span>
                                    {unreadMessages > 0 && (
                                        <span className="ml-2 text-xs font-semibold text-red-500 bg-red-100 rounded-full px-2 py-1">
                                            {unreadMessages} Unread
                                        </span>
                                    )}
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex flex-col flex-1 ml-72">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 fixed top-0 left-72 right-0 z-10">
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
                <main className="flex-1 p-8 mt-[73px] overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Your Assigned Tasks</h2>
                        {assignedTasks.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {assignedTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                                        onClick={() => handleTaskClick(task.room_id)}
                                    >
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{task.content}</h3>
                                        <p className="text-gray-500 mb-2">
                                            Status:{" "}
                                            <span
                                                className={`font-medium ${task.toDo === "Completed"
                                                    ? "text-green-500"
                                                    : task.toDo === "In Progress"
                                                        ? "text-blue-500"
                                                        : task.toDo === "Blocked"
                                                            ? "text-red-500"
                                                            : "text-gray-500"
                                                    }`}
                                            >
                                                {task.toDo}
                                            </span>
                                        </p>
                                        <p className="text-gray-500 mb-4">
                                            Priority:{" "}
                                            <span
                                                className={`font-medium ${task.priority === "urgent"
                                                    ? "text-red-600"
                                                    : task.priority === "high"
                                                        ? "text-orange-500"
                                                        : task.priority === "medium"
                                                            ? "text-yellow-500"
                                                            : "text-green-500"
                                                    }`}
                                            >
                                                {task.priority}
                                            </span>
                                        </p>
                                        {task.toDo === "Completed" && (
                                            <div className="flex items-center text-green-500">
                                                <CheckCircle2 className="h-5 w-5 mr-2" />
                                                Completed
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded" role="alert">
                                <p className="font-bold">No tasks assigned</p>
                                <p>You currently have no tasks assigned to you.</p>
                            </div>
                        )}
                        <Outlet />
                    </div>
                </main>
                
            </div>
        </div>
    );
};

export default Dashboard;
