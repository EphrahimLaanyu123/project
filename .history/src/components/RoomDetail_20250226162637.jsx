import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase";

function RoomDetail() {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    async function fetchRoomDetails() {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, name, creator_id") // Fetch creator_id
        .eq("id", roomId)
        .single();

      if (error) {
        setErrorMessage("Failed to load room details.");
      } else {
        setRoom(data);
      }
    }

    const fetchRoomMembers = async () => {
        const { data, error } = await supabase.rpc('get_room_members', {
          room_uuid: roomId,
        });
      
        if (error) {
          console.error("Error fetching room members:", error);
        } else {
          console.log("Room Members:", data);
        }
      };
      

    async function getCurrentUser() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        setErrorMessage("Failed to fetch user.");
      } else {
        setCurrentUser(user);
      }
    }

    async function checkIfCreator() {
      await getCurrentUser();
      if (room && currentUser) {
        setIsCreator(room.creator_id === currentUser.id);
      }
    }

    fetchRoomDetails();
    fetchRoomMembers();
    getCurrentUser();
  }, [roomId, room, currentUser]);

  // Add Member Function
  const addMember = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!newMember.trim()) {
      setErrorMessage("Please enter a username.");
      return;
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("username", newMember)
      .single();

    if (userError || !user) {
      setErrorMessage("User not found.");
      return;
    }

    const { error: insertError } = await supabase
      .from("room_members")
      .insert([{ room_id: roomId, user_id: user.id }]);

    if (insertError) {
      setErrorMessage("Failed to add member. Try again.");
    } else {
      setMembers([...members, { user_id: user.id, users: { username: newMember } }]);
      setNewMember("");
    }
  };

  return (
    <div>
      {errorMessage && <div style={{ color: "red", marginBottom: "10px" }}>{errorMessage}</div>}

      {room ? (
        <>
          <h2>{room.name}</h2>
          <h3>Members</h3>
          <ul>
            {members.map((member) => (
              <li key={member.user_id}>{member.users.username}</li>
            ))}
          </ul>

          {/* Only show Add Member form if the user is the creator */}
          {isCreator && (
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
          )}
        </>
      ) : (
        <p>Loading room details...</p>
      )}
    </div>
  );
}

export default RoomDetail;
