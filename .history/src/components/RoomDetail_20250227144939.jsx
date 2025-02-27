import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase";
import Tasks from "./Tasks";
import TaskDetail from "./TaskDetail";
import ChatRoom from "./ChatRoom"; // Import the ChatRoom component

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
    <div className="bg-white text-black min-h-screen p-6">
      {errorMessage && <div className="text-red-500 mb-4">{errorMessage}</div>}
      {room ? (
        <div className="max-w-2xl mx-auto bg-gray-100 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">{room.name}</h2>
          <h3 className="text-lg font-semibold mb-2">Members</h3>
          <ul className="mb-4">
            {members.map((member) => (
              <li key={member.user_id} className="py-1">
                {user && member.user_id === user.id ? `You${member.isCreator ? " (Creator)" : ""}` : `${member.username}${member.isCreator ? " (Creator)" : ""}`}
              </li>
            ))}
          </ul>
          
          <button className="bg-black text-white px-4 py-2 rounded-lg mr-2" onClick={() => setShowTaskModal(true)}>Add Task</button>
          <button className="bg-black text-white px-4 py-2 rounded-lg" onClick={() => setShowChatModal(true)}>Chat</button>

          {showTaskModal && <Tasks roomId={roomId} onClose={() => setShowTaskModal(false)} />}
          {showChatModal && <ChatRoom roomId={roomId} user={user} onClose={() => setShowChatModal(false)} />}

          <h3 className="text-lg font-semibold mt-6 mb-2">Tasks</h3>
          <ul>
            {tasks.map((task) => (
              <li key={task.id} className="cursor-pointer underline" onClick={() => setSelectedTask(task)}>
                {task.content} - <strong>{task.priority}</strong>
              </li>
            ))}
          </ul>
          {selectedTask && <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />}
        </div>
      ) : (
        <p>Loading room details...</p>
      )}
    </div>
  );
}

export default RoomDetail;