import { useEffect, useState } from "react";
// Assuming supabase is configured and imported from a separate file
// For this example, I'll mock it for demonstration purposes.
// In a real app, you would have: import { supabase } from "../supabase";

// Mock Supabase for demonstration purposes.
// In a real application, you would connect to your actual Supabase instance.
const supabase = {
  auth: {
    getUser: async () => {
      // Simulate fetching a logged-in user
      const user = { id: "user-123", email: "test@example.com" };
      return { data: { user }, error: null };
    },
  },
  from: (tableName) => ({
    select: (columns) => ({
      eq: (column, value) => ({
        async then(callback) {
          if (tableName === "task_members" && column === "user_id" && value === "user-123") {
            // Simulate fetching task members for the user
            callback({ data: [{ task_id: "task-101" }, { task_id: "task-102" }], error: null });
          } else {
            callback({ data: [], error: null });
          }
        }
      }),
      in: (column, values) => ({
        async then(callback) {
          if (tableName === "tasks" && column === "id") {
            // Simulate fetching task details based on IDs
            const mockTasks = [];
            if (values.includes("task-101")) {
              mockTasks.push({ id: "task-101", title: "Complete MyTasks Component", description: "Develop the React component to fetch and display user tasks." });
            }
            if (values.includes("task-102")) {
              mockTasks.push({ id: "task-102", title: "Review Pull Request", description: "Review the latest code changes for the Rooms component." });
            }
            callback({ data: mockTasks, error: null });
          } else {
            callback({ data: [], error: null });
          }
        }
      }),
    }),
  }),
};


import { CheckCircle, XCircle, Loader, ListTodo } from "lucide-react"; // Icons for tasks

function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserAndTasks() {
      setIsLoading(true);
      setErrorMessage("");

      // 1. Get the current user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        setErrorMessage("Failed to get user information. Please log in again.");
        setIsLoading(false);
        return;
      }

      const userId = authData.user.id;
      setUser({ id: userId, email: authData.user.email });

      // 2. Fetch task IDs from the 'task_members' table for the current user
      const { data: taskMembers, error: memberError } = await supabase
        .from("task_members")
        .select("task_id")
        .eq("user_id", userId);

      if (memberError) {
        setErrorMessage("Error fetching your assigned tasks.");
        setIsLoading(false);
        return;
      }

      if (taskMembers && taskMembers.length > 0) {
        const taskIds = taskMembers.map((member) => member.task_id);

        // 3. Fetch task details from the 'tasks' table using the retrieved task IDs
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select("*") // Select all columns for task details
          .in("id", taskIds);

        if (tasksError) {
          setErrorMessage("Error fetching details for your tasks.");
        } else {
          setTasks(tasksData || []);
        }
      } else {
        // No tasks assigned to this user
        setTasks([]);
      }
      
      setIsLoading(false);
    }

    fetchUserAndTasks();
  }, []); // Empty dependency array means this effect runs once on mount

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-inter">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        <p className="ml-4 text-lg text-gray-700">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter antialiased">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-4 sm:px-6 lg:px-8 sticky top-0 z-10 rounded-b-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <ListTodo className="h-8 w-8 text-blue-700" />
            <div>
              <p className="text-lg font-semibold text-gray-900">My Assigned Tasks</p>
              {user?.email && <p className="text-sm text-gray-600">Logged in as: {user.email}</p>}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tasks List */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-5 flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            Your Tasks
          </h2>
          {tasks.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <li key={task.id} className="py-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <ListTodo className="h-5 w-5 text-gray-500 mt-1" />
                    </div>
                    <div className="ml-3">
                      <p className="text-base font-medium text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{task.description || "No description provided."}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-6 text-center text-base text-gray-500 bg-gray-50 rounded-lg">
              <p>You currently have no tasks assigned to you.</p>
              <p className="mt-2">Keep up the great work!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default MyTasks;
