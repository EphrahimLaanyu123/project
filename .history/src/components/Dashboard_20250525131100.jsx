import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from "../supabase"; // Assuming supabase is correctly configured and imported
import { LogOut, UserCircle, LayoutDashboard, CheckCircle2, MessageCircle, Home, ListTodo, Users } from "lucide-react"; // Import Users icon
import BottomNavBar from "./BottomNavBar"; // Assuming BottomNavBar is correctly configured and imported

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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="relative w-16 h-16">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-black rounded-full animate-spin border-t-transparent"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard flex flex-col md:flex-row min-h-screen bg-gray-100 font-inter">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white border-r border-gray-200 shadow-xl md:shadow-lg fixed md:relative h-auto md:h-screen z-20 md:z-auto transition-all duration-300 ease-in-out pb-16 md:pb-0">
                <div className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-10">
                        <LayoutDashboard className="h-9 w-9 text-indigo-600" />
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Dashboard
                        </h2>
                    </div>
                    <nav>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    to="/dashboard"
                                    className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200 group font-medium"
                                >
                                    <Home className="h-5 w-5 mr-3 text-gray-500 group-hover:text-indigo-600 transition-colors" />
                                    <span className="text-lg group-hover:translate-x-1 transition-transform duration-200">
                                        Home
                                    </span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/rooms"
                                    className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200 group font-medium"
                                >
                                    <MessageCircle className="h-5 w-5 mr-3 text-gray-500 group-hover:text-indigo-600 transition-colors" />
                                    <span className="text-lg group-hover:translate-x-1 transition-transform duration-200">
                                        Rooms
                                    </span>
                                    {unreadMessages > 0 && (
                                        <span className="ml-auto text-xs font-bold text-white bg-red-500 rounded-full px-2.5 py-1 shadow-sm">
                                            {unreadMessages}
                                        </span>
                                    )}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/tasks"
                                    className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200 group font-medium"
                                >
                                    <ListTodo className="h-5 w-5 mr-3 text-gray-500 group-hover:text-indigo-600 transition-colors" />
                                    <span className="text-lg group-hover:translate-x-1 transition-transform duration-200">
                                        My Tasks
                                    </span>
                                </Link>
                            </li>
                            {/* New Teams Link */}
                            <li>
                                <Link
                                    to="/teams"
                                    className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200 group font-medium"
                                >
                                    <Users className="h-5 w-5 mr-3 text-gray-500 group-hover:text-indigo-600 transition-colors" />
                                    <span className="text-lg group-hover:translate-x-1 transition-transform duration-200">
                                        Teams
                                    </span>
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex flex-col flex-1 md:ml-64">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 fixed top-0 left-0 md:left-64 right-0 z-10 shadow-sm">
                    <div className="max-w-full mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-3 md:mb-0">
                            Overview of all projects
                        </h1>
                        {user && (
                            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 w-full md:w-auto justify-end">
                                {/* User Profile Info */}
                                <div className="flex items-center space-x-3 bg-gray-50 p-2 rounded-full pr-4 shadow-inner">
                                    <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full p-2 shadow-md">
                                        <UserCircle className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{user.username || "User"}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                </div>

                                {/* Message Info (optional, if you want to keep it separate from Rooms link) */}
                                {/* <div className="flex items-center space-x-3 bg-gray-50 p-2 rounded-full pr-4 shadow-inner">
                                    <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full p-2 shadow-md">
                                        <MessageCircle className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">Messages</p>
                                        <p className="text-xs text-gray-500">{unreadMessages} Unread</p>
                                    </div>
                                </div> */}

                                {/* Sign Out Button */}
                                <button
                                    onClick={signOut}
                                    className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-6 md:p-8 mt-[120px] md:mt-[73px] overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="max-w-7xl mx-auto">
                        {errorMessage && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 shadow-md" role="alert">
                                <p className="font-bold">Error</p>
                                <p>{errorMessage}</p>
                            </div>
                        )}

                        <h2 className="text-3xl font-extrabold mb-8 text-gray-900">Your Assigned Tasks</h2>
                        {assignedTasks.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {assignedTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                                        onClick={() => handleTaskClick(task.room_id)}
                                    >
                                        <h3 className="text-xl font-semibold text-gray-900 mb-3 leading-tight">{task.content}</h3>
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-sm text-gray-600">Status:</p>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold ${task.toDo === "Completed"
                                                    ? "bg-green-100 text-green-700"
                                                    : task.toDo === "In Progress"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : task.toDo === "Blocked"
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-gray-100 text-gray-700"
                                                    }`}
                                            >
                                                {task.toDo}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-sm text-gray-600">Priority:</p>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold ${task.priority === "urgent"
                                                    ? "bg-red-100 text-red-700"
                                                    : task.priority === "high"
                                                        ? "bg-orange-100 text-orange-700"
                                                        : task.priority === "medium"
                                                            ? "bg-yellow-100 text-yellow-700"
                                                            : "bg-green-100 text-green-700"
                                                    }`}
                                            >
                                                {task.priority}
                                            </span>
                                        </div>
                                        {task.toDo === "Completed" && (
                                            <div className="flex items-center text-green-600 font-medium text-sm mt-2">
                                                <CheckCircle2 className="h-5 w-5 mr-2" />
                                                Task Completed
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-700 p-5 rounded-lg shadow-md" role="alert">
                                <p className="font-bold text-lg mb-1">No tasks assigned to you!</p>
                                <p className="text-base">It looks like you currently don't have any tasks. Keep up the great work!</p>
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
