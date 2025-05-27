import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (replace with your own keys)
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const MyTask = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);

      // Get current logged in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('User not logged in');
        setLoading(false);
        return;
      }

      // Fetch tasks where user is assigned in task_members
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

      // Extract tasks from the joined data
      const userTasks = data.map((item) => item.tasks);

      setTasks(userTasks);
      setLoading(false);
    };

    fetchTasks();
  }, []);

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
              <div>
                Deadline: {new Date(task.deadline).toLocaleDateString()}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MyTask;
