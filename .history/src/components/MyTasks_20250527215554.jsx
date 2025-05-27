import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your actual Supabase Project URL and Public Anon Key
// You can find these in your Supabase project settings under API.
const supabaseUrl = 'https://ugrimbgwdrwetazlpkcf.supabase.co'; // e.g., 'https://abcdefghijk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVncmltYmd3ZHJ3ZXRhemxwa2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NjYzMzUsImV4cCI6MjA1NjA0MjMzNX0.wSxAMXX4oD7UgXD_KhX5f83c9HlVKWbjJTby-K8QgRs'; // e.g., 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

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
            created_at,
            roo
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

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-700">Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-100 text-red-700 p-4 rounded-lg">
        <p className="text-lg">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-white shadow-lg rounded-lg my-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">My Tasks</h2>


      {tasks.length === 0 ? (
        <p className="text-gray-600">No tasks assigned to you.</p>
      ) : (
        <ul className="space-y-4">
          {tasks.map((task) => (
            <li key={task.id} className="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200">
              <strong className="text-xl text-gray-900 block mb-1">{task.content}</strong>
              <div className="text-gray-700 text-sm">
                <span className="font-semibold">Priority:</span> {task.priority || 'N/A'},
                <span className="ml-2 font-semibold">Status:</span> {task.status || 'N/A'}
              </div>
              {task.deadline && (
                <div className="text-gray-600 text-xs mt-1">
                  <span className="font-semibold">Deadline:</span> {new Date(task.deadline).toLocaleDateString()}
                </div>
              )}
              {task.created_at && (
                <div className="text-gray-600 text-xs mt-1">
                  <span className="font-semibold">Created At:</span> {new Date(task.created_at).toLocaleString()}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyTask;
