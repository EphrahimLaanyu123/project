import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { X, CheckSquare, Clock, AlertTriangle, Plus, MessageCircle } from "lucide-react";

function TaskDetail({ task, onClose }) {
  if (!task) return null;

  const [status, setStatus] = useState(task.status || "In Progress");
  const [subtasks, setSubtasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
    } else {
      setErrorMessage("Failed to update status");
    }
  }

  // Add a subtask
  async function addSubtask(e) {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    
    const { error } = await supabase.from("subtasks").insert([{ 
      task_id: task.id, 
      content: newSubtask,
      is_completed: false
    }]);
    
    if (error) {
      setErrorMessage("Failed to add subtask");
    } else {
      setNewSubtask("");
    }
  }

  // Toggle subtask completion
  async function toggleSubtask(subtaskId, currentStatus) {
    const newStatus = !currentStatus;
    const { error } = await supabase
      .from("subtasks")
      .update({ is_completed: newStatus })
      .eq("id", subtaskId);
      
    if (error) {
      setErrorMessage("Failed to update subtask");
    } else {
      setSubtasks(subtasks.map(st => 
        st.id === subtaskId ? {...st, is_completed: newStatus} : st
      ));
    }
  }

  // Add a comment
  async function addComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase.from("comments").insert([{ 
      task_id: task.id, 
      user_id: user.user.id, 
      comment: newComment 
    }]);
    
    if (error) {
      setErrorMessage("Failed to add comment");
    } else {
      setNewComment("");
    }
  }

  // Log activity
  async function logActivity(action, oldValue = "", newValue = "") {
    const { data: user } = await supabase.auth.getUser();
    await supabase.from("task_activity").insert([{ 
      task_id: task.id, 
      user_id: user.user.id, 
      action, 
      old_value: oldValue, 
      new_value: newValue 
    }]);
  }

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Task Details</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {errorMessage && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            {/* Task Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{task.content}</h3>
              <div className="flex flex-wrap gap-2 items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority || 'No Priority'}
                </span>
                <span className="text-xs text-gray-500">
                  Created: {new Date(task.created_at).toLocaleString()}
                </span>
              </div>
            </div>
            
            {/* Status Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => updateStatus("To Do")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    status === "To Do" 
                      ? "bg-gray-900 text-white" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  To Do
                </button>
                <button
                  onClick={() => updateStatus("In Progress")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    status === "In Progress" 
                      ? "bg-yellow-500 text-white" 
                      : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                  }`}
                >
                  <Clock className="inline-block h-4 w-4 mr-1" />
                  In Progress
                </button>
                <button
                  onClick={() => updateStatus("completed")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    status === "completed" 
                      ? "bg-green-500 text-white" 
                      : "bg-green-50 text-green-700 hover:bg-green-100"
                  }`}
                >
                  <CheckSquare className="inline-block h-4 w-4 mr-1" />
                  Completed
                </button>
              </div>
            </div>
            
            {/* Subtasks Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Subtasks</h3>
              <ul className="space-y-2 mb-3">
                {subtasks.length > 0 ? (
                  subtasks.map((subtask) => (
                    <li key={subtask.id} className="flex items-center">
                      <button
                        onClick={() => toggleSubtask(subtask.id, subtask.is_completed)}
                        className={`mr-2 p-1 rounded-md ${
                          subtask.is_completed 
                            ? "text-green-500 hover:text-green-600" 
                            : "text-gray-400 hover:text-gray-500"
                        }`}
                      >
                        <CheckSquare className="h-5 w-5" />
                      </button>
                      <span className={`text-sm ${subtask.is_completed ? "line-through text-gray-500" : "text-gray-700"}`}>
                        {subtask.content}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500">No subtasks yet</li>
                )}
              </ul>
              <form onSubmit={addSubtask} className="flex gap-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="Add new subtask"
                  className="flex-1 shadow-sm focus:ring-black focus:border-black block w-full sm:text-sm border-gray-300 rounded-md"
                />
                <button
                  type="submit"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-black shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
            </div>
            
            {/* Comments Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Comments</h3>
              <div className="bg-gray-50 rounded-lg p-3 mb-3 max-h-40 overflow-y-auto">
                {comments.length > 0 ? (
                  <ul className="space-y-3">
                    {comments.map((comment, index) => (
                      <li key={comment.id || index} className="bg-white p-3 rounded-md shadow-sm">
                        <div className="flex items-center mb-1">
                          <div className="bg-gray-200 rounded-full p-1 mr-2">
                            <MessageCircle className="h-3 w-3 text-gray-500" />
                          </div>
                          <span className="text-xs font-medium text-gray-700">
                            {comment.users?.username || "User"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{comment.comment}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">No comments yet</p>
                )}
              </div>
              <form onSubmit={addComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment"
                  className="flex-1 shadow-sm focus:ring-black focus:border-black block w-full sm:text-sm border-gray-300 rounded-md"
                />
                <button
                  type="submit"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-black shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              </form>
            </div>
            
            {/* Activity Log */}
            {activity.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Activity Log</h3>
                <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <ul className="space-y-2">
                    {activity.map((log) => (
                      <li key={log.id} className="text-xs text-gray-600">
                        <span className="font-medium">{log.action}</span>
                        {log.old_value && log.new_value && (
                          <span>: {log.old_value} → {log.new_value}</span>
                        )}
                        <span className="text-gray-400 ml-1">
                          ({new Date(log.changed_at).toLocaleString()})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskDetail;