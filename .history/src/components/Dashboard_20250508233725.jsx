// src/pages/Dashboard.jsx

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
    fetchUser();
  }, []);

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
    const userEmail = authData.user.email;
    let username = null;

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("username")
      .eq("id", userId)
      .single();

    if (!userError && userData) {
      username = userData.username;
    }

    setUser({ id: userId, email: userEmail, username });

    // Fetch tasks assigned to this user
    const { data: tasksData, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("assigned_to", userId);

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError.message);
      setErrorMessage("Failed to fetch tasks.");
    } else {
      setTasks(tasksData || []);
    }

    setIsLoading(false);
  }

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (errorMessage) {
    return <div className="p-8 text-red-500">{errorMessage}</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Navbar user={user} />
        <main className="flex-1 p-8 mt-[73px] overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Your Tasks</h2>
            {tasks.length === 0 ? (
              <p className="text-gray-600">You have no assigned tasks.</p>
            ) : (
              <ul className="space-y-4">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="p-4 border border-gray-300 rounded-lg bg-white shadow-sm"
                  >
                    <h3 className="font-bold text-lg">{task.content}</h3>
                    <p className="text-sm text-gray-600">
                      Priority: {task.priority}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: {task.status}
                    </p>
                    {task.deadline && (
                      <p className="text-sm text-gray-600">
                        Deadline:{" "}
                        {new Date(task.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
