import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration - replace with your actual project URL and Anon Key
const supabaseUrl = 'https://your-project.supabase.co'; // Replace with your Supabase Project URL
const supabaseAnonKey = 'your-anon-key'; // Replace with your Supabase Public Anon Key

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const MyTask = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null); // State to store the authenticated user's ID
  const [isAuthReady, setIsAuthReady] = useState(false); // To track if auth state is resolved

  // Effect for Supabase Authentication setup and listener
  useEffect(() => {
    // Listen to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
          setUserId(session.user.id); // Set the userId from the authenticated user
          setError(null);
        } else {
          setUser(null);
          setUserId(null);
          setError('User not logged in or session expired.');
        }
        setIsAuthReady(true); // Mark auth as ready once the initial check is done
        setLoading(false); // Stop loading after auth state is determined
      }
    );

    // Check session immediately on mount
    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData?.session?.user) {
        setUser(sessionData.session.user);
        setUserId(sessionData.session.user.id);
      } else {
        setError('User not logged in or session expired.');
      }
      setIsAuthReady(true); // Mark auth as ready after initial session check
      setLoading(false); // Stop loading after auth state is determined
    });

    // Cleanup the auth listener on component unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs once on mount

  // Effect for fetching tasks from Supabase
  useEffect(() => {
    // Only fetch tasks if authentication is ready and a user is logged in
    if (!isAuthReady || !userId) {
      if (isAuthReady && !userId) {
        setTasks([]); // Clear tasks if no user is logged in
      }
      return;
    }

    setLoading(true);
    setError(null);

    const fetchTasks = async () => {
      // Fetch tasks by joining 'task_members' and 'tasks' tables
      // and filtering by the current user's ID
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

      // Extract the task details from the joined data
      const userTasks = data.map((item) => item.tasks);

      setTasks(userTasks);
      setLoading(false);
    };

    fetchTasks();
  }, [isAuthReady, userId]); // Re-run when auth state is ready or userId changes

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
      {userId && (
        <p className="text-sm text-gray-500 mb-4">
          Current User ID: <span className="font-mono bg-gray-100 p-1 rounded">{userId}</span>
        </p>
      )}

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
              {task.created_at && ( // Use created_at for Supabase
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
