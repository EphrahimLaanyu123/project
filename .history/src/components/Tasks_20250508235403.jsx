import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";

function Tasks({ roomId, onClose }) {
  const [taskContent, setTaskContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [priority, setPriority] = useState("low");
  const [assignedTo, setAssignedTo] = useState(null);
  const [roomUsers, setRoomUsers] = useState([]);

  useEffect(() => {
    const fetchRoomUsers = async () => {
      if (!roomId) return;

      const { data: members, error } = await supabase
        .from("room_members")
        .select("user_id")
        .eq("room_id", roomId);

      if (error) {
        console.error("Error fetching room members:", error);
        setErrorMessage("Failed to fetch room members. Please try again.");
        return;
      }

      if (!members || members.length === 0) {
          setRoomUsers([]);
          return;
      }

      const userIds = members.map((member) => member.user_id);


      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, username") // Changed from name to username
        .in("id", userIds);

      if (usersError) {
        console.error("Error fetching users:", usersError);
        setErrorMessage("Failed to fetch user details.");
        return;
      }

      if(users){
        setRoomUsers(users);
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

    try {
      await supabase.rpc("begin");

      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .insert([
          {
            room_id: roomId,
            content: taskContent,
            priority,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          },
        ])
        .select("id");

      if (taskError) {
        throw new Error(taskError.message);
      }

      const taskId = taskData?.[0]?.id;

      if (taskId && assignedTo) {
        const { error: memberError } = await supabase
          .from("task_members")
          .insert([
            {
              task_id: taskId,
              user_id: assignedTo,
            },
          ]);
        if (memberError) {
          throw new Error(memberError.message);
        }
      }

      await supabase.rpc("commit");

      setTaskContent("");
      setAssignedTo(null);
      onClose();
    } catch (error) {
      await supabase.rpc("rollback");
      setErrorMessage("Failed to add task: " + error.message);
      console.error("Transaction Error:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Task</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
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
          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
              Assign To
            </label>
            <select
              id="assignedTo"
              value={assignedTo || ""}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="">Unassigned</option>
              {roomUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
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
