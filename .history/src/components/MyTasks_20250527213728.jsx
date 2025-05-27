import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const MyTask = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Listen to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
          setError(null);
        } else {
          setUser(null);
          setError('User not logged in');
        }
      }
    );

    // Check session immediately on mount
    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData?.session?.user) {
        setUser(sessionData.session.user);
      } else {
        setError('User not logged in');
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    const fetchTasks = async () => {
      const { data, error } = await supabase
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
        .eq('user_id', user.id);

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const userTasks = data.map((item) => item.tasks);

      setTasks(userTasks);
      setLoading(false);
    };

    fetchTasks();
  }, [user]);

  if (loading) return <p>Loading tasks...</p>;
  if (error) return <p>Error: {error}</p>;
  if (tasks.length === 0) return <p>No tasks assigned to you.</p>;

  return (
    <div>
      <h2>My Tasks</h2>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <strong>{task.content}</strong> — Priority: {task.priority}, Status: {task.status}
            {task.deadline && (
              <div>Deadline: {new Date(task.deadline).toLocaleDateString()}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MyTask;
