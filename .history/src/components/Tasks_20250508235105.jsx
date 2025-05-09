import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";

function Tasks({ roomId, onClose }) {
  const [taskContent, setTaskContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [priority, setPriority] = useState("low");
  const [assignedTo, setAssignedTo] = useState<string | null>(null); // Changed to string | null
  const [roomUsers, setRoomUsers] = useState<{ id: string; name: string }[]>([]); // Array of user objects

  useEffect(() => {
    const fetchRoomUsers = async () => {
      if (!roomId) return;

      const { data: users, error } = await supabase
        .from("room_users")
        .select("user_id")
        .eq("room_id", roomId);

      if (error) {
        console.error("Error fetching room users:", error);
        return; // Important: Exit if there's an error
      }

      if (!users || users.length === 0) {
        setRoomUsers([]);
        return;
      }

      // Extract user IDs
      const userIds = users.map((ru) => ru.user_id);

      // Fetch user details (id and name) based on the extracted IDs
      const { data: userDetails, error: userDetailsError } = await supabase
        .from("users")
        .select("id, name")
        .in("id", userIds); // Use the IN operator

      if (userDetailsError) {
        console.error("Error fetching user details:", userDetailsError);
        return;
      }
      if(userDetails){
        setRoomUsers(userDetails);
      }

    };

    fetchRoomUsers();
  }, [roomId]);

  const addTask = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!taskContent.trim()) {
      setErrorMessage("Task content cannot be empty.");
      return;
    }

    // Start a transaction
    try {
      await supabase.rpc('begin');

      // Insert the task
      const { data: taskData, error: taskError } = await supabase.from("tasks").insert([
        {
          room_id: roomId,
          content: taskContent,
          priority,
          created_by: (await supabase.auth.getUser()).data.user?.id, // Get current user
        },
      ]).select('id'); // Select the id of the newly inserted task

      if (taskError) {
        throw new Error(taskError.message); // Throw error to rollback
      }

      const taskId = taskData?.[0]?.id; // Get the ID of the new task.

        // Insert into task_members if assignedTo is not null
      if (taskId && assignedTo) {
          const { error: memberError } = await supabase.from("task_members").insert([
            {
              task_id: taskId,
              user_id: assignedTo,
            },
          ]);
          if (memberError) {
              throw new Error(memberError.message);
          }
        }


      // Commit the transaction
      await supabase.rpc('commit');

      setTaskContent("");
      setAssignedTo(null); // Reset assignedTo state
      onClose();
    } catch (error: any) {
      // Rollback the transaction on error
      await supabase.rpc('rollback');
      setErrorMessage("Failed to add task: " + error.message);
      console.error("Transaction Error:", error);

    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Task</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-2 bg-red-50 text-red-600 rounded">
            {errorMessage}
          </div>
        )}

        <form onSubmit={addTask} className="space-y-4">
          <div>
            <label htmlFor="taskContent" className="block text-sm font-medium text-gray-700 mb-1">
              Task Description
            </label>
            <input
              id="taskContent"
              type="text"
              value={taskContent}
              onChange={(e) => setTaskContent(e.target.value)}
              placeholder="Enter task description"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          {/* New dropdown for assigning a user */}
          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
              Assign To
            </label>
            <select
              id="assignedTo"
              value={assignedTo || ""} // Control the selected value
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="">Unassigned</option> {/* Add an empty option */}
              {roomUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Tasks;
