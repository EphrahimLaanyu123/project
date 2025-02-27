import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase";
import Tasks from "./Tasks";
import TaskDetail from "./TaskDetail";

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
        console.error(roomMembersError);
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
        console.error(roomError);
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
        console.error(usersError);
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
        console.error(error);
      } else {
        setTasks(data);
      }
    }

    async function fetchUser() {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        setErrorMessage("Failed to get user information.");
        console.error(authError);
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

  async function handleAddMember(event) {
    event.preventDefault();

    if (!newMember.trim()) {
      setErrorMessage("Username cannot be empty.");
      return;
    }

    try {
      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("username", newMember)
        .single();

      if (userError) {
        setErrorMessage("User not found.");
        console.error(userError);
        return;
      }

      const userIdToAdd = userData.id;

      // Check if user is already a member
      const { data: existingMember, error: memberError } = await supabase
        .from("room_members")
        .select("*")
        .eq("room_id", roomId)
        .eq("user_id", userIdToAdd)
        .single();

      if (existingMember) {
        setErrorMessage("User is already a member.");
        return;
      }

      // Add user to the room_members table
      const { error: insertError } = await supabase.from("room_members").insert([
        {
          room_id: roomId,
          user_id: userIdToAdd,
        },
      ]);

      if (insertError) {
        setErrorMessage("Failed to add member.");
        console.error(insertError);
        return;
      }

      // Refresh members list
      await fetchRoomMembers();
      setNewMember("");
      setErrorMessage("");
    } catch (error) {
      console.error("Unexpected error:", error);
      setErrorMessage("An unexpected error occurred.");
    }
  }

  return (
    <div>
      {errorMessage && (
        <div style={{ color: "red", marginBottom: "10px" }}>{errorMessage}</div>
      )}

      {room ? (
        <>
          <h2>{room.name}</h2>
          <h3>Members</h3>
          <ul>
            {members.map((member) => (
              <li key={member.user_id}>
                {user && member.user_id === user.id
                  ? `You${member.isCreator ? " (Creator)" : ""}`
                  : `${member.username}${member.isCreator ? " (Creator)" : ""}`}
              </li>
            ))}
          </ul>

          {/* Add Member Form - Only visible to the creator */}
          {isCreator && (
            <form onSubmit={handleAddMember}>
              <input
                type="text"
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                placeholder="Enter username"
                required
              />
              <button type="submit">Add Member</button>
            </form>
          )}

          {/* Add Task Button */}
          <button onClick={() => setShowTaskModal(true)}>Add Task</button>

          {/* Task Modal */}
          {showTaskModal && <Tasks roomId={roomId} onClose={() => setShowTaskModal(false)} />}

          {/* Task List */}
          <h3>Tasks</h3>
          <ul>
            {tasks.map((task) => (
              <li
                key={task.id}
                style={{ cursor: "pointer", textDecoration: "underline" }}
                onClick={() => setSelectedTask(task)}
              >
                {task.content} - <strong>{task.priority}</strong>
              </li>
            ))}
          </ul>

          {/* Task Detail Modal */}
          {selectedTask && <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />}
        </>
      ) : (
        <p>Loading room details...</p>
      )}
    </div>
  );
}

export default RoomDetail;
