import { useState, useEffect } from "react";
import { supabase } from "../supabase";

function TaskDetail({ task, onClose }) {
  if (!task) return null;

  const [status, setStatus] = useState(task.status || "To Do");
  const [subtasks, setSubtasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [newSubtask, setNewSubtask] = useState("");

  useEffect(() => {
    fetchSubtasks();
    fetchComments();
    fetchActivity();

    // Subscribe to real-time updates
    const channel = supabase.channel(`task:${task.id}`);

    // Listen for task status updates
    channel.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "tasks", filter: `id=eq.${task.id}` },
      (payload) => {
        setStatus(payload.new.status); // Update status in real-time
      }
    );

    // Listen for new subtasks
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "subtasks", filter: `task_id=eq.${task.id}` },
      (payload) => {
        setSubtasks((prev) => [...prev, payload.new]);
      }
    );

    // Listen for new comments
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "comments", filter: `task_id=eq.${task.id}` },
      (payload) => {
        setComments((prev) => [...prev, payload.new]);
      }
    );

    // Listen for new activity logs
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "task_activity", filter: `task_id=eq.${task.id}` },
      (payload) => {
        setActivity((prev) => [payload.new, ...prev]);
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel); // Cleanup subscription on unmount
    };
  }, [task.id]);

  // Fetch subtasks
  async function fetchSubtasks() {
    const { data, error } = await supabase.from("subtasks").select("*").eq("task_id", task.id);
    if (!error) setSubtasks(data || []);
  }

  // Fetch comments
  async function fetchComments() {
    const { data, error } = await supabase.from("comments").select("*, users(username)").eq("task_id", task.id);
    if (!error) setComments(data || []);
  }

  // Fetch activity log
  async function fetchActivity() {
    const { data, error } = await supabase
      .from("task_activity")
      .select("*")
      .eq("task_id", task.id)
      .order("changed_at", { ascending: false });
    if (!error) setActivity(data || []);
  }

  // Handle status change
  async function updateStatus(newStatus) {
    const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id);
    if (!error) {
      logActivity("Status changed", status, newStatus);
      setStatus(newStatus);
    }
  }

  // Add a subtask
  async function addSubtask(e) {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    const { error } = await supabase.from("subtasks").insert([{ task_id: task.id, content: newSubtask }]);
    if (!error) setNewSubtask("");
  }

  // Add a comment
  async function addComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase.from("comments").insert([{ task_id: task.id, user_id: user.user.id, comment: newComment }]);
    if (!error) setNewComment("");
  }

  // Log activity
  async function logActivity(action, oldValue = "", newValue = "") {
    const { data: user } = await supabase.auth.getUser();
    await supabase.from("task_activity").insert([{ task_id: task.id, user_id: user.user.id, action, old_value: oldValue, new_value: newValue }]);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl my-8 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold mb-6 pr-8">Task Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold mb-1">Content</p>
              <p className="text-gray-700">{task.content}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold mb-1">Priority</p>
              <span className={`px-2 py-1 text-xs rounded ${
                task.priority === 'high' ? 'bg-black text-white' :
                task.priority === 'medium' ? 'bg-gray-600 text-white' :
                task.priority === 'urgent' ? 'bg-gray-900 text-white' :
                'bg-gray-200 text-black'
              }`}>
                {task.priority}
              </span>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold mb-1">Created At</p>
              <p className="text-gray-700">{new Date(task.created_at).toLocaleString()}</p>
            </div>
            
            {/* Status Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold mb-2">Status</p>
              <select 
                value={status} 
                onChange={(e) => updateStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Subtasks Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Subtasks</h3>
              {subtasks.length > 0 ? (
                <ul className="mb-3 space-y-1">
                  {subtasks.map((subtask) => (
                    <li key={subtask.id} className="flex items-center">
                      <span className="mr-2">{subtask.is_completed ? "✅" : "❌"}</span>
                      <span>{subtask.content}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic mb-3">No subtasks yet</p>
              )}
              <form onSubmit={addSubtask} className="flex space-x-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="Add new subtask"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black text-sm"
                />
                <button 
                  type="submit"
                  className="px-3 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors text-sm"
                >
                  Add
                </button>
              </form>
            </div>
            
            {/* Comments Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Comments</h3>
              {comments.length > 0 ? (
                <ul className="mb-3 space-y-2">
                  {comments.map((comment) => (
                    <li key={comment.id} className="bg-white p-2 rounded border border-gray-200">
                      <p className="font-semibold text-xs">{comment.users?.username || 'Unknown user'}</p>
                      <p>{comment.comment}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic mb-3">No comments yet</p>
              )}
              <form onSubmit={addComment} className="flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black text-sm"
                />
                <button 
                  type="submit"
                  className="px-3 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors text-sm"
                >
                  Add
                </button>
              </form>
            </div>
          </div>
        </div>
        
        {/* Activity Log */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Activity Log</h3>
          {activity.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {activity.map((log) => (
                <li key={log.id} className="border-b border-gray-100 pb-1">
                  <span className="font-medium">{log.action}</span>: {log.old_value} → {log.new_value} 
                  <span className="text-gray-500 text-xs ml-2">
                    ({new Date(log.changed_at).toLocaleString()})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No activity recorded yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskDetail;