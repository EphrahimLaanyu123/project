import { useState } from "react";
import { supabase } from "../supabase";
import { X, AlertTriangle } from "lucide-react";

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
        status: "In Progress"
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Add Task</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="px-6 py-4">
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
          
          <form onSubmit={addTask} className="space-y-4">
            <div>
              <label htmlFor="task-content" className="block text-sm font-medium text-gray-700 mb-1">
                Task Description
              </label>
              <textarea
                id="task-content"
                rows="3"
                value={taskContent}
                onChange={(e) => setTaskContent(e.target.value)}
                placeholder="Enter task description"
                className="shadow-sm focus:ring-black focus:border-black block w-full sm:text-sm border-gray-300 rounded-md"
                required
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
                className="shadow-sm focus:ring-black focus:border-black block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                Add Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Tasks;