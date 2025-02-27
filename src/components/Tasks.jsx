import { useState } from "react";
import { supabase } from "../supabase";

function Tasks({ roomId, onClose }) {
  const [taskContent, setTaskContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [priority, setPriority] = useState("low");

  const addTask = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!taskContent.trim()) {
      setErrorMessage("Task content cannot be empty.");
      return;
    }

    const { error } = await supabase.from("tasks").insert([
      {
        room_id: roomId,
        content: taskContent,
        priority,
      },
    ]);

    if (error) {
      setErrorMessage("Failed to add task.");
    } else {
      setTaskContent("");
      onClose(); // Close modal after adding task
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Add Task</h2>
        {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
        <form onSubmit={addTask}>
          <input
            type="text"
            value={taskContent}
            onChange={(e) => setTaskContent(e.target.value)}
            placeholder="Enter task description"
            required
          />
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <button type="submit">Add Task</button>
        </form>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default Tasks;
