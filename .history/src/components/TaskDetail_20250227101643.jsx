import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import "./TaskDetail.css";

function TaskDetail({ task, onClose }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch comments for the task
  useEffect(() => {
    async function fetchComments() {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("task_id", task.id)
        .order("created_at", { ascending: true });
      if (error) setErrorMessage("Failed to load comments.");
      else setComments(data);
    }
    fetchComments();
  }, [task.id]);

  const addComment = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!newComment.trim()) return;

    const { data, error } = await supabase
      .from("comments")
      .insert([{ task_id: task.id, comment: newComment }])
      .select()
      .single();

    if (error) {
      setErrorMessage("Failed to add comment.");
    } else {
      setComments([...comments, data]);
      setNewComment("");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>
        <h2>Task Detail</h2>
        <p><strong>Content:</strong> {task.content}</p>
        <p><strong>Priority:</strong> {task.priority}</p>
        <p><strong>Status:</strong> {task.status}</p>
        {task.deadline && <p><strong>Deadline:</strong> {new Date(task.deadline).toLocaleString()}</p>}
        
        <h3>Comments</h3>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        <ul className="comment-list">
          {comments.map((comment) => (
            <li key={comment.id}>
              {comment.comment} <span className="timestamp">{new Date(comment.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>

        <form onSubmit={addComment} className="comment-form">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            required
          />
          <button type="submit">Add Comment</button>
        </form>
      </div>
    </div>
  );
}

export default TaskDetail;
