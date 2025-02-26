import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase";

function RoomDetail() {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [user, setUser] = useState(null);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    async function fetchRoomDetails() {
      const { data, error } = await supabase.from("rooms").select("*").eq("id", roomId).single();
      if (error) setErrorMessage("Failed to load room details.");
      else setRoom(data);
    }

    async function fetchRoomMembers() {
      // 1. Get room_members data
      const { data: roomMembersData, error: roomMembersError } = await supabase
        .from("room_members")
        .select("user_id")
        .eq("room_id", roomId);

      if (roomMembersError) {
        setErrorMessage("Failed to load room members.");
        return;
      }

      // Collect all user IDs (including the creator)
      let userIds = roomMembersData.map((member) => member.user_id);

      // 2. Fetch the room creator separately
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("created_by")
        .eq("id", roomId)
        .single();

      if (roomError) {
        setErrorMessage("Failed to load room details.");
        return;
      }

      // Ensure creator is in the members list
      if (!userIds.includes(roomData.created_by)) {
        userIds.push(roomData.created_by);
      }

      // 3. Get user data based on user_ids
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("username, id")
        .in("id", userIds);

      if (usersError) {
        setErrorMessage("Failed to load user details.");
        return;
      }

      // 4. Combine data and mark the creator
      const combinedData = userIds.map((userId) => {
        const user = usersData.find((u) => u.id === userId);
        return {
          user_id: user?.id,
          username: user?.username,
          isCreator: userId === roomData.created_by, // Mark if the user is the creator
        };
      });

      // Sort to put the creator at the top
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

    fetchRoomDetails();
    fetchRoomMembers();
    fetchUser();
  }, [roomId]);

  useEffect(() => {
    if (user && room) {
      setIsCreator(user.id === room.created_by);
    }
  }, [user, room]);

  // Add Member Function
  const addMember = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear any previous errors

    if (!newMember.trim()) {
      setErrorMessage("Please enter a username.");
      return;
    }

    // Find the user ID based on the username
    const { data: userToAdd, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("username", newMember)
      .single();

    if (userError || !userToAdd) {
      setErrorMessage("User not found.");
      return;
    }

    // Add the user to the room
    const { error: insertError } = await supabase
      .from("room_members")
      .insert([{ room_id: roomId, user_id: userToAdd.id }]);

    if (insertError) {
      setErrorMessage("Failed to add member. Try again.");
    } else {
      // Refresh members list without reloading the page
      setMembers([...members, { user_id: userToAdd.id, username: newMember, isCreator: false }]);
      setNewMember("");
    }
  };

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
                {member.isCreator ? `${member.username} (Creator)` : member.username}
              </li>
            ))}
          </ul>

          {/* Add Member Form - Only visible to the creator */}
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
