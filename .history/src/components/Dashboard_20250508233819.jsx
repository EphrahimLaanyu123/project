import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { supabase } from "../client";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchUserAndTasks();
  }, []);

  const fetchUserAndTasks = async () => {
    setIsLoading(true);
    setErrorMessage("");

    // Get authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      setErrorMessage("Authentication failed. Please log in.");
      setIsLoading(false);
      return;
    }

    const userId = authUser.id;

    // Get user profile (username)
    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .select("username")
      .eq("id", userId)
      .single();

    if (profileError) {
      setErrorMessage("Failed to fetch user profile.");
      setIsLoading(false);
      return;
    }

    const username = profileData?.username;

    setUser({
      id: userId,
      email: authUser.email,
      username,
    });

    // Fetch tasks assigned to the user
    const { data: tasksData, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("assigned_to", userId)
      .order("created_at", { ascending: false });

    if (tasksError) {
      setErrorMessage("Failed to fetch tasks.");
    } else {
      setTasks(tasksData || []);
    }

    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600 text-lg">Loading dashboard...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500 text-lg">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Navbar user={user} />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 pt-[73px]">
          <div className="p-8 max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Welcome, {user.username}</h2>

            <h3 className="text-xl font-semibold mb-4">Your Tasks</h3>
            {tasks.length === 0 ? (
              <p className="text-gray-500">You have no tasks assigned yet.</p>
            ) : (
              <div className="grid gap-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white border border-gray-200 shadow-sm rounded-lg p-4"
                  >
                    <h4 className="font-semibold text-lg">{task.content}</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      Priority: <span className="font-medium">{task.priority}</span>
                    </p>
                    <p className="text-sm text-gray-700">
                      Status: <span className="font-medium">{task.status}</span>
                    </p>
                    {task.deadline && (
                      <p className="text-sm text-gray-700">
                        Deadline:{" "}
                        {new Date(task.deadline).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                ))}
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
