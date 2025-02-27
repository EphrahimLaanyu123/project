import { useEffect, useState, useRef } from "react";
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

    async function fetchUser() {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        setErrorMessage("Failed to get user information.");
        return;
      }
      setUser(authData.user);
    }

    fetchRoomDetails();
    fetchUser();
  }, [roomId]);

  useEffect(() => {
    if (user && room) {
      setIsCreator(user.id === room.created_by);
    }
  }, [user, room]);

  return (
    <div>
      {errorMessage && (
        <div style={{ color: "red", marginBottom: "10px" }}>{errorMessage}</div>
      )}

      {room ? (
        <>
          <h2>{room.name}</h2>
          <button onClick={() => setShowChatModal(true)}>Open Chat</button>
          {showChatModal && <ChatRoom roomId={roomId} user={user} onClose={() => setShowChatModal(false)} />}
        </>
      ) : (
        <p>Loading room details...</p>
      )}
    </div>
  );
}

export default RoomDetail;
