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
  const [showChatModal, setShowChatModal] = useState(false); // Add state for chat modal

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

    async function fetchUser() {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        setErrorMessage("Failed to get user information.");
        return;
      }
      setUser(authData.user);
    }

    async function fetchTasks() {
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("room_id", roomId);

      if (tasksError) {
        setErrorMessage("Failed to load tasks.");
        return;
      }

      setTasks(tasksData);
    }

    fetchRoomDetails();
    fetchRoomMembers();
    fetchUser();
    fetchTasks();

    // Real-time subscription for room_members
    const memberSubscription = supabase
      .channel("realtime:room_members")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_members" },
        (payload) => {
          console.log("New member added:", payload.new);
          fetchRoomMembers(); // Refresh the members list
        }
      )
      .subscribe();

    const taskSubscription = supabase
      .channel("realtime:tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          console.log("Task change:", payload);
          fetchTasks(); // Refresh the tasks list
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(memberSubscription);
      supabase.removeChannel(taskSubscription);
    };
  }, [roomId]);

  useEffect(() => {
    if (user && room) {
      setIsCreator(user.id === room.created_by);
    }
  }, [user, room]);

  async function handleAddMember(event) {
    event.preventDefault();

    if (!newMember) return;

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("username", newMember)
      .single();

    if (userError || !userData) {
      console.error("User not found:", userError);
      setErrorMessage("User not found.");
      return;
    }

    const userId = userData.id;

    const { data: existingMember, error: memberError } = await supabase
      .from("room_members")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .single();

    if (existingMember) {
      console.warn("User is already a member of this room.");
      setErrorMessage("User is already a member of this room.");
      return;
    }

    if (memberError && memberError.code !== "PGRST116") {
      console.error("Error checking existing member:", memberError);
      setErrorMessage("Error checking existing member.");
      return;
    }

    const { error } = await supabase
      .from("room_members")
      .insert([{ room_id: roomId, user_id: userId }]);

    if (error) {
      console.error("Error adding member:", error);
      setErrorMessage("Failed to add member.");
    } else {
      console.log("Member added successfully.");
      setNewMember("");
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

          {/* Members List */}
          <div>
            <h3 className="text-xl font-semibold mb-2">Members</h3>
            <ul className="list-disc list-inside">
              {members.map((member) => (
                <li key={member.user_id}>
                  {member.username} {member.isCreator && "(Creator)"}
                </li>
              ))}
            </ul>
            {isCreator && (
              <form onSubmit={handleAddMember} className="mt-4">
                <input
                  type="text"
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  placeholder="Enter username"
                  className="border p-2 rounded mr-2"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  Add Member
                </button>
              </form>
            )}
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
