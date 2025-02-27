import React, { useState, useEffect } from "react";
import { supabase } from "../supabase"; // Ensure Supabase is properly configured

function TaskDetail({ task, onClose }) {
  if (!task) return null;

  const [status, setStatus] = useState(task.status);
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
    if (!error) setSubtasks(data);
  }

  // Fetch comments
  async function fetchComments() {
    const { data, error } = await supabase.from("comments").select("*, users(username)").eq("task_id", task.id);
    if (!error) setComments(data);
  }

  // Fetch activity log
  async function fetchActivity() {
    const { data, error } = await supabase
      .from("task_activity")
      .select("*")
      .eq("task_id", task.id)
      .order("changed_at", { ascending: false });
    if (!error) setActivity(data);
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
  async function addSubtask() {
    if (!newSubtask.trim()) return;
    const { data, error } = await supabase.from("subtasks").insert([{ task_id: task.id, content: newSubtask }]);
    if (!error) setNewSubtask("");
  }

  // Add a comment
  async function addComment() {
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
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button style={styles.closeButton} onClick={onClose}>✖</button>
        <h2>Task Details</h2>
        <p><strong>Content:</strong> {task.content}</p>
        <p><strong>Priority:</strong> {task.priority}</p>
        <p><strong>Created At:</strong> {new Date(task.created_at).toLocaleString()}</p>

        {/* Status Section */}
        <h3>Status</h3>
        <select value={status} onChange={(e) => updateStatus(e.target.value)} style={styles.select}>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Blocked">Blocked</option>
        </select>

        {/* Subtasks Section */}
        <h3>Subtasks</h3>
        <ul>
          {subtasks.map((subtask) => (
            <li key={subtask.id}>{subtask.content} - {subtask.is_completed ? "✅" : "❌"}</li>
          ))}
        </ul>
        <input type="text" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} placeholder="Add new subtask" style={styles.input} />
        <button onClick={addSubtask} style={styles.button}>Add Subtask</button>

        {/* Comments Section */}
        <h3>Comments</h3>
        <ul>
          {comments.map((comment) => (
            <li key={comment.id}><strong>{comment.users?.username}:</strong> {comment.comment}</li>
          ))}
        </ul>
        <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment" style={styles.input} />
        <button onClick={addComment} style={styles.button}>Add Comment</button>

        {/* Activity Log */}
        <h3>Activity Log</h3>
        <ul>
          {activity.map((log) => (
            <li key={log.id}>
              <strong>{log.action}</strong>: {log.old_value} → {log.new_value} ({new Date(log.changed_at).toLocaleString()})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    background: "#fff",
    padding: "20px",
    borderRadius: "5px",
    width: "400px",
  },
  closeButton: {
    position: "absolute",
    top: "10px",
    right: "10px",
    border: "none",
    background: "transparent",
    fontSize: "16px",
    cursor: "pointer",
  },
  input: {
    width: "100%",
    padding: "8px",
    marginBottom: "10px",
  },
  button: {
    padding: "8px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
};

export default TaskDetail;
