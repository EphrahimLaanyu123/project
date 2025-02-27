import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase";
import Tasks from "./Tasks";
import TaskDetail from "./TaskDetail";
import ChatRoom from "./ChatRoom";

function RoomDetail() {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState("");

  useEffect(() => {
    async function fetchRoomDetails() {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();
      if (!error) setRoom(data);
    }

    async function fetchTasks() {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("room_id", roomId);
      if (!error) setTasks(data);
    }

    async function fetchUsers() {
      const { data, error } = await supabase
        .from("room_users")
        .select("id, user_id, users(username, email)")
        .eq("room_id", roomId);
      if (!error) setUsers(data);
    }

    async function fetchUser() {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) setUser(authData.user);
    }

    fetchRoomDetails();
    fetchTasks();
    fetchUsers();
    fetchUser();

    // Subscribe to real-time task updates
    const taskSubscription = supabase
      .channel("realtime-tasks")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tasks", filter: `room_id=eq.${roomId}` },
        (payload) => {
          setTasks((prevTasks) => [...prevTasks, payload.new]);
        }
      )
      .subscribe();

    // Subscribe to real-time user updates
    const userSubscription = supabase
      .channel("realtime-users")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_users", filter: `room_id=eq.${roomId}` },
        (payload) => {
          setUsers((prevUsers) => [...prevUsers, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(taskSubscription);
      supabase.removeChannel(userSubscription);
    };
  }, [roomId]);

  useEffect(() => {
    if (user && room) {
      setIsCreator(user.id === room.created_by);
    }
  }, [user, room]);

  async function addUserToRoom(e) {
    e.preventDefault();
    if (!newUserEmail.trim()) return;

    // Find user by email
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", newUserEmail)
      .single();

    if (userError || !userData) {
      alert("User not found.");
      return;
    }

    // Add user to room
    const { error: insertError } = await supabase.from("room_users").insert([
      { room_id: roomId, user_id: userData.id }
    ]);

    if (!insertError) {
      setNewUserEmail("");
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {room ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold border-b border-gray-200 pb-2">{room.name}</h2>
            <div className="space-x-2">
              <button
                onClick={() => setShowUserModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                Manage Users 👥
              </button>
              <button
                onClick={() => setShowChatModal(true)}
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
              >
                Chat 💬
              </button>
            </div>
          </div>

          {/* Task List */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-semibold">Tasks</h3>
              <button
                onClick={() => setShowTaskModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Add Task
              </button>
            </div>

            {tasks.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <li 
                    key={task.id} 
                    className="py-3 px-2 hover:bg-gray-100 cursor-pointer transition-colors flex justify-between items-center"
                    onClick={() => setSelectedTask(task)}
                  >
                    <span>{task.content}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      task.priority === 'high' ? 'bg-black text-white' :
                      task.priority === 'medium' ? 'bg-gray-600 text-white' :
                      task.priority === 'urgent' ? 'bg-gray-900 text-white' :
                      'bg-gray-200 text-black'
                    }`}>
                      {task.priority}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No tasks yet</p>
            )}
          </div>

          {/* User Management Modal */}
          {showUserModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Manage Users</h3>
                  <button 
                    onClick={() => setShowUserModal(false)}
                    className="text-gray-500 hover:text-black text-xl"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={addUserToRoom} className="flex space-x-2 mb-4">
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="Enter user email"
                    required
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                  >
                    Add
                  </button>
                </form>
                <h4 className="text-lg font-semibold mb-2">Current Users</h4>
                <ul className="space-y-2">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <li key={user.id} className="p-2 bg-gray-100 rounded">
                        {user.users?.username || "Unknown User"} - {user.users?.email}
                      </li>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No users in this room yet.</p>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Modals */}
          {showTaskModal && <Tasks roomId={roomId} onClose={() => setShowTaskModal(false)} />}
          {selectedTask && <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />}
          {showChatModal && <ChatRoom roomId={roomId} user={user} onClose={() => setShowChatModal(false)} />}
        </div>
      ) : (
        <div className="flex justify-center items-center h-64">
          <p>Loading room details...</p>
        </div>
      )}
    </div>
  );
}

export default RoomDetail;
