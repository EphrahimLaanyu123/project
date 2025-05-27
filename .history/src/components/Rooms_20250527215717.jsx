import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ListFilter, Loader2, AlertCircle, User, LogOut } from 'lucide-react'; // Import Lucide icons

// IMPORTANT: Replace with your actual Supabase Project URL and Public Anon Key
// You can find these in your Supabase project settings under API.
const supabaseUrl = 'https://your-project.supabase.co'; // e.g., 'https://abcdefghijk.supabase.co'
const supabaseAnonKey = 'your-anon-key'; // e.g., 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const MyTask = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null); // Stores the full user object from Supabase
  const [userId, setUserId] = useState(null); // Stores just the user's ID
  const [isAuthReady, setIsAuthReady] = useState(false); // Tracks if the initial auth check is complete

  // Effect for Supabase Authentication setup and listener
  useEffect(() => {
    // This function handles updating state based on the session
    const handleAuthSession = (session) => {
      if (session?.user) {
        setUser(session.user);
        setUserId(session.user.id); // Set the userId from the authenticated user
        setError(null); // Clear any previous errors
      } else {
        setUser(null);
        setUserId(null);
        setError('User not logged in or session expired. Please log in.');
      }
      setIsAuthReady(true); // Mark auth as ready once the initial check is done
      setLoading(false); // Stop loading after auth state is determined
    };

    // Listen to auth state changes
    // This listener will fire on initial load and whenever auth state changes (login, logout, token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        handleAuthSession(session);
      }
    );

    // Immediately check the current session on component mount
    // This is important for when the user navigates directly to this page
    supabase.auth.getSession().then(({ data: sessionData }) => {
      handleAuthSession(sessionData?.session);
    });

    // Cleanup the auth listener on component unmount to prevent memory leaks
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs once on mount

  // Effect for fetching tasks from Supabase
  useEffect(() => {
    // Only fetch tasks if authentication is ready AND a user is logged in (userId is available)
    if (!isAuthReady) {
      // If auth is not ready, we wait.
      return;
    }

    if (!userId) {
      // If auth is ready but no userId, it means no user is logged in.
      setTasks([]); // Clear tasks if no user is logged in
      setLoading(false); // Stop loading as we've determined there's no user
      return;
    }

    setLoading(true); // Start loading for task fetch
    setError(null); // Clear any previous errors

    const fetchTasks = async () => {
      // Fetch tasks by joining 'task_members' and 'tasks' tables
      // and filtering by the current user's ID.
      // This uses a "join" syntax in Supabase, where `tasks ( ... )` fetches related data.
      const { data, error: fetchError } = await supabase
        .from('task_members')
        .select(`
          task_id,
          tasks (
            id,
            content,
            priority,
            status,
            deadline,
            created_at
          )
        `)
        .eq('user_id', userId); // Filter tasks assigned to the current user

      if (fetchError) {
        console.error("Supabase Fetch Error:", fetchError);
        setError(`Failed to load tasks: ${fetchError.message}`);
        setLoading(false);
        return;
      }

      // Extract the actual task details from the joined data
      // Each item in 'data' will have a 'tasks' property containing the task object
      const userTasks = data.map((item) => item.tasks);

      setTasks(userTasks);
      setLoading(false); // Stop loading after tasks are fetched
    };

    fetchTasks();
  }, [isAuthReady, userId]); // Re-run this effect when auth state is ready or userId changes

  // Function to handle user sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Optionally navigate to a login page or home page after sign out
      // For now, we'll just let the auth listener handle state change.
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Failed to sign out. Please try again.");
    }
  };

  // --- Render Logic ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
            <div className="flex items-center gap-4">
              {user?.email && (
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {user.email}
                </span>
              )}
              <button
                onClick={signOut}
                className="text-sm text-gray-600 hover:text-red-500 flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-gray-500 text-lg">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mb-4" />
            <p>Loading tasks...</p>
          </div>
        ) : (
          <>
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <p className="ml-3 text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* User ID display (optional, for debugging/info) */}
            {userId && (
              <p className="text-sm text-gray-500 mb-4">
                Current User ID: <span className="font-mono bg-gray-100 p-1 rounded">{userId}</span>
              </p>
            )}

            {/* Tasks List */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center mb-4">
                <ListFilter className="h-5 w-5 text-blue-500 mr-2" />
                Your Assigned Tasks
              </h2>
            </div>

            {tasks.length === 0 ? (
              <div className="p-12 bg-white rounded-xl shadow-sm text-center">
                <ListFilter className="h-12 w-12 text-gray-300 mb-4 mx-auto" />
                <p className="text-gray-500">No tasks assigned to you.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-l-4 border-blue-400 shadow-sm hover:shadow-md text-left"
                  >
                    <strong className="text-xl text-gray-900 block mb-2 truncate">{task.content}</strong>
                    <div className="text-gray-700 text-sm flex flex-wrap gap-x-3 gap-y-1">
                      <span className="font-semibold">Priority:</span> {task.priority || 'N/A'}
                      <span className="font-semibold">Status:</span> {task.status || 'N/A'}
                    </div>
                    {task.deadline && (
                      <div className="text-gray-600 text-xs mt-2">
                        <span className="font-semibold">Deadline:</span> {new Date(task.deadline).toLocaleDateString()}
                      </div>
                    )}
                    {task.created_at && (
                      <div className="text-gray-600 text-xs mt-1">
                        <span className="font-semibold">Created At:</span> {new Date(task.created_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default MyTask;
