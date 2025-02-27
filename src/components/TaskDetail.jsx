import React from "react";
import "./TaskDetail.css"; // Import the CSS file

function TaskDetail({ task, onClose }) {
  if (!task) return null;

  return (
    <div className="task-modal-overlay">
      <div className="task-modal">
        <button className="task-modal-close" onClick={onClose}>
          &times;
        </button>
        <h2>Task Details</h2>
        <p><strong>Content:</strong> {task.content}</p>
        <p><strong>Priority:</strong> {task.priority}</p>
        <p><strong>Created At:</strong> {new Date(task.created_at).toLocaleString()}</p>
      </div>
    </div>
  );
}

export default TaskDetail;
