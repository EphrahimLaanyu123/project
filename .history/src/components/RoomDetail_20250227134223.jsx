import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase";
import Tasks from "./Tasks"; 
import TaskDetail from "./TaskDetail"; 
import ChatRoom from "./ChatRoom"; 

function RoomDetail() {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newMember, setNewMember] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [user, setUser] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);

  useEffect(() => {
    async function fetchRoomDetails() {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();
      if (error) setErrorMessage("Failed to load room details.");
      else setRoom(data);
    }

    async function fetchRoomMembers() {
      const { data: roomMembersData, error: roomMembersError } = await supabase
        .from("room_members")
        .select("user_id")
        .eq("room_id", roomId);

      if (roomMembersError) {
        setErrorMessage("Failed to load room members.");
        return;
      }

      let userIds = roomMembersData.map((member) => member.user_id);

      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("created_by")
        .eq("id", roomId)
        .single();

      if (roomError) {
        setErrorMessage("Failed to load room details.");
        return;
      }

      if (!userIds.includes(roomData.created_by)) {
        userIds.push(roomData.created_by);
      }

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("username, id")
        .in("id", userIds);

      if (usersError) {
        setErrorMessage("Failed to load user details.");
        return;
      }

      const combinedData = userIds.map((userId) => {
        const user = usersData.find((u) => u.id === userId);
        return {
          user_id: user?.id,
          username: user?.username,
          isCreator: userId === roomData.created_by,
        };
      });

      setMembers(combinedData.sort((a, b) => b.isCreator - a.isCreator));
    }

    async function fetchTasks() {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("room_id", roomId);

      if (error) {
        setErrorMessage("Failed to load tasks.");
      } else {
        setTasks(data);
      }
    }

    async function fetchUser() {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        setErrorMessage("Failed to get user information.");
        return;
      }
      setUser(authData.user);
    }

    fetchRoomDetails();
    fetchRoomMembers();
    fetchTasks();
    fetchUser();
  }, [roomId]);

  useEffect(() => {
    if (user && room) {
      setIsCreator(user.id === room.created_by);
    }
  }, [user, room]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {errorMessage && (
        <div className="text-red-600 mb-4 p-2 bg-red-50 rounded">{errorMessage}</div>
      )}

      {room ? (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold border-b border-gray-200 pb-2">{room.name}</h2>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Members</h3>
            <ul className="divide-y divide-gray-200">
              {members.map((member) => (
                <li key={member.user_id} className="py-2">
                  {user && member.user_id === user.id
                    ? <span className="font-medium">You{member.isCreator ? " " : ""}</span>
                    : <span>{member.username}</span>}
                  {member.isCreator && (
                    <span className="ml-2 px-2 py-1 text-xs bg-black text-white rounded">Creator</span>
                  )}
                </li>
              ))}
            </ul>

            {/* Add Member Form - Only visible to the creator */}
            {isCreator && (
              <form className="mt-4 flex space-x-2" onSubmit={() => {}}>
                <input
                  type="text"
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  placeholder="Enter username"
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                />
                <button 
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                >
                  Add Member
                </button>
              </form>
            )}
          </div>

          <div className="flex space-x-4 my-6">
            <button 
              onClick={() => setShowTaskModal(true)}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
            >
              Add Task
            </button>
            <button 
              onClick={() => setShowChatModal(true)}
              className="px-4 py-2 border border-black text-black rounded hover:bg-gray-100 transition-colors"
            >
              Chat
            </button>
          </div>

          {/* Task List */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Tasks</h3>
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
          {showChatModal && <ChatRoom roomId={roomId} user={user} onClose={() => setShowChatModal(false)} />}
          {selectedTask && <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />}
        </div>
      ) : (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomDetail;