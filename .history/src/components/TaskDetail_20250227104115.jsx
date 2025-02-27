import React, { useState, useEffect } from "react";
import supabase from "../supabaseClient"; // Import Supabase client

function TaskDetail({ task, onClose }) {
  const [subtasks, setSubtasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState(task?.status || "To Do");
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (!task) return;

    // Fetch Subtasks and Comments
    fetchSubtasks();
    fetchComments();

    // Subscribe to real-time updates
    const taskSubscription = supabase
      .channel("task_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, (payload) => {
        if (payload.new.id === task.id) {
          setStatus(payload.new.status);
        }
      })
      .subscribe();

    const subtaskSubscription = supabase
      .channel("subtask_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "subtasks" }, (payload) => {
        fetchSubtasks();
      })
      .subscribe();

    const commentSubscription = supabase
      .channel("comment_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, (payload) => {
        fetchComments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(taskSubscription);
      supabase.removeChannel(subtaskSubscription);
      supabase.removeChannel(commentSubscription);
    };
  }, [task]);

  const fetchSubtasks = async () => {
    const { data, error } = await supabase.from("subtasks").select("*").eq("task_id", task.id);
    if (!error) setSubtasks(data);
  };

  const fetchComments = async () => {
    const { data, error } = await supabase.from("comments").select("*").eq("task_id", task.id);
    if (!error) setComments(data);
  };

  const updateStatus = async (newStatus) => {
    await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id);
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    await supabase.from("comments").insert([{ task_id: task.id, user_id: "user-id-here", comment: newComment }]);
    setNewComment("");
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button style={styles.closeButton} onClick={onClose}>✖</button>
        <h2>Task Details</h2>
        <p><strong>Content:</strong> {task.content}</p>
        <p><strong>Priority:</strong> {task.priority}</p>
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Created At:</strong> {new Date(task.created_at).toLocaleString()}</p>

        {/* Status Dropdown */}
        <select value={status} onChange={(e) => updateStatus(e.target.value)}>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Blocked">Blocked</option>
        </select>

        {/* Subtasks */}
        <h3>Subtasks</h3>
        <ul>
          {subtasks.map((subtask) => (
            <li key={subtask.id}>{subtask.content} - {subtask.is_completed ? "✔" : "❌"}</li>
          ))}
        </ul>

        {/* Comments */}
        <h3>Comments</h3>
        <ul>
          {comments.map((comment) => (
            <li key={comment.id}>{comment.comment}</li>
          ))}
        </ul>
        
        {/* Add Comment */}
        <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} />
        <button onClick={addComment}>Add Comment</button>
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
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    width: "400px",
    position: "relative",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
  },
  closeButton: {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
  },
};

export default TaskDetail;
