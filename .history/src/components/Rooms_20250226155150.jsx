import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { FaUserCircle } from "react-icons/fa";

function Rooms() {
  const [myRooms, setMyRooms] = useState([]);
  const [addedRooms, setAddedRooms] = useState([]);
  const [user, setUser] = useState(null);
  const [roomName, setRoomName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUserAndRooms() {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) return;

      const userId = authData.user.id;
      setUser(authData.user);

      // Fetch username
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("username")
        .eq("id", userId)
        .single();

      if (!userError) setUser({ ...authData.user, username: userData?.username });

      // Fetch rooms created by user
      const { data: createdRooms, error: createdError } = await supabase
        .from("rooms")
        .select("*")
        .eq("created_by", userId);

      if (!createdError) setMyRooms(createdRooms || []);

      // Fetch rooms where user is a member
      const { data: memberRooms, error: memberError } = await supabase
        .from("room_members")
        .select("room_id, rooms(*)")
        .eq("user_id", userId)
        .innerJoin("rooms", "room_members.room_id", "rooms.id");

      if (!memberError) setAddedRooms(memberRooms.map((entry) => entry.rooms));
    }

    fetchUserAndRooms();
  }, []);

  // Add a new room
  const addRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim() || !user) return;

    const { data, error } = await supabase
      .from("rooms")
      .insert([{ name: roomName, created_by: user.id }])
      .select();

    if (error) {
      console.error(error);
    } else if (data?.length > 0) {
      setMyRooms([...myRooms, data[0]]);
      setRoomName("");
    }
  };

  // Sign Out Function
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div>
      {/* User Profile */}
      {user && (
        <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
          <FaUserCircle size={40} style={{ marginRight: "10px" }} />
          <p style={{ fontSize: "18px", fontWeight: "bold" }}>{user.username || "User"}</p>
        </div>
      )}

      <h2>Rooms</h2>
      <button onClick={signOut} style={{ marginBottom: "20px", cursor: "pointer" }}>
        Sign Out
      </button>

      {/* Add Room Form */}
      <form onSubmit={addRoom} style={{ marginBottom: "20px" }}>
        <input 
          type="text" 
          value={roomName} 
          onChange={(e) => setRoomName(e.target.value)} 
          placeholder="Enter room name" 
          required 
        />
        <button type="submit">Add Room</button>
      </form>

      {/* My Rooms */}
      <h3>My Rooms</h3>
      {myRooms.length > 0 ? (
        <ul>
          {myRooms.map((room) => (
            <li 
              key={room.id} 
              style={{ cursor: "pointer", textDecoration: "underline" }} 
              onClick={() => navigate(`/rooms/${room.id}`)}
            >
              {room.name}
            </li>
          ))}
        </ul>
      ) : (
        <p>No rooms created yet.</p>
      )}

      {/* Added Rooms */}
      <h3>Added Rooms</h3>
      {addedRooms.length > 0 ? (
        <ul>
          {addedRooms.map((room) => (
            <li 
              key={room.id} 
              style={{ cursor: "pointer", textDecoration: "underline" }} 
              onClick={() => navigate(`/rooms/${room.id}`)}
            >
              {room.name}
            </li>
          ))}
        </ul>
      ) : (
        <p>Not added to any rooms yet.</p>
      )}
    </div>
  );
}

export default Rooms;
