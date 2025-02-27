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
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newUserName, setNewUserName] = useState(""); // For adding users

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
        .select("username")
        .eq("room_id", roomId);
      if (!error) setUsers(data.map((user) => user.username));
    }

    async function fetchUser() {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) setUser(authData.user);
    }

    fetchRoomDetails();
    fetchTasks();
    fetchUsers();
    fetchUser();

    // Real-time updates for tasks
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

    // Real-time updates for users
    const userSubscription = supabase
      .channel("realtime-users")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_users", filter: `room_id=eq.${roomId}` },
        (payload) => {
          setUsers((prevUsers) => [...prevUsers, payload.new.username]);
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

  async function handleAddUser() {
    if (!newUserName.trim()) return;
    
    // Fetch user by username
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("username", newUserName)
      .single();

    if (userError || !userData) {
      alert("User not found!");
      return;
    }

    // Add user to the room
    const { error } = await supabase.from("room_users").insert([
      { room_id: roomId, username: newUserName, user_id: userData.id },
    ]);

    if (!error) {
      setNewUserName(""); // Clear input
    } else {
      alert("Failed to add user.");
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {room ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold border-b border-gray-200 pb-2">{room.name}</h2>
            <button
              onClick={() => setShowChatModal(true)}
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
            >
              Chat 💬
            </button>
          </div>

          {/* Users List */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-xl font-semibold">Users in this Room</h3>
            <ul className="mt-2 space-y-1">
              {users.length > 0 ? (
                users.map((username, index) => (
                  <li key={index} className="text-gray-700">
                    - {username}
                  </li>
                ))
              ) : (
                <p className="text-gray-500 italic">No users yet</p>
              )}
            </ul>

            {/* Add User Input */}
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Enter username..."
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="border px-3 py-2 rounded w-full"
              />
              <button
                onClick={handleAddUser}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Add User
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
