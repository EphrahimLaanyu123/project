import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase";

function RoomDetail() {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState("");

  useEffect(() => {
    async function fetchRoomDetails() {
      const { data, error } = await supabase.from("rooms").select("*").eq("id", roomId).single();
      if (error) console.error(error);
      else setRoom(data);
    }

    async function fetchRoomMembers() {
      const { data, error } = await supabase
        .from("room_members")
        .select("user_id, users(username)")
        .eq("room_id", roomId)
        .innerJoin("users", "room_members.user_id", "users.id");

      if (error) console.error(error);
      else setMembers(data);
    }

    fetchRoomDetails();
    fetchRoomMembers();
  }, [roomId]);

  // Add Member Function
  const addMember = async (e) => {
    e.preventDefault();
    if (!newMember.trim()) return;

    // Find the user ID based on the username
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("username", newMember)
      .single();

    if (userError || !user) {
      console.error("User not found");
      return;
    }

    const { error } = await supabase
      .from("room_members")
      .insert([{ room_id: roomId, user_id: user.id }]);

    if (error) {
      console.error(error);
    } else {
      setMembers([...members, { user_id: user.id, users: { username: newMember } }]);
      setNewMember("");
    }
  };

  return (
    <div>
      {room ? (
        <>
          <h2>{room.name}</h2>
          <h3>Members</h3>
          <ul>
            {members.map((member) => (
              <li key={member.user_id}>{member.users.username}</li>
            ))}
          </ul>

          {/* Add Member Form */}
          <form onSubmit={addMember}>
            <input
              type="text"
              value={newMember}
              onChange={(e) => setNewMember(e.target.value)}
              placeholder="Enter username"
              required
            />
            <button type="submit">Add Member</button>
          </form>
        </>
      ) : (
        <p>Loading room details...</p>
      )}
    </div>
  );
}

export default RoomDetail;
