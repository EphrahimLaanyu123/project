import React, { useEffect, useState } from 'react';

const MyTask = ({ user }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setError('User not logged in');
      setLoading(false);
      return;
    }

    const fetchTasks = async () => {
      setLoading(true);

      // Assume supabase is already initialized and imported
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
