import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { FaUserCircle } from "react-icons/fa";

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [user, setUser] = useState(null);
  const [roomName, setRoomName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("users")
          .select("username")
          .eq("id", user.id)
          .single();
        
        if (!error) {
          setUser({ ...user, username: data?.username });
          fetchRooms(user.id);
        }
      }
    }

    async function fetchRooms(userId) {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("created_by", userId); // Fetch only rooms created by the user

      if (error) console.error(error);
      else setRooms(data);
    }

    fetchUser();
  }, []);

  // Add Room Function
  const addRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim() || !user) return;
  
    const { data, error } = await supabase
      .from("rooms")
      .insert([{ name: roomName, created_by: user.id }])
      .select(); // Ensure we get back the inserted row
  
    if (error) {
      console.error(error);
    } else if (data && data.length > 0) {
      setRooms([...rooms, data[0]]); // Append the new room correctly
      setRoomName(""); // Reset input field
    }
  };
  

  // Sign Out Function
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/"); // Redirect to home after sign out
  };

  return (
    <div>
      {/* User Profile Section */}
      {user && (
        <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
          <FaUserCircle size={40} style={{ marginRight: "10px" }} />
          <p style={{ fontSize: "18px", fontWeight: "bold" }}>{user.username || "User"}</p>
        </div>
      )}

      <h2>Rooms</h2>

      {/* Add Room Form */}
      <form onSubmit={addRoom} style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Enter room name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          required
          style={{ padding: "8px", marginRight: "10px" }}
        />
        <button type="submit">Add Room</button>
      </form>

      <button onClick={signOut} style={{ marginBottom: "20px", cursor: "pointer" }}>
        Sign Out
      </button>

      {/* User's Rooms List */}
      <ul>
        {rooms.length > 0 ? (
          rooms.map((room) => <li key={room.id}>{room.name}</li>)
        ) : (
          <p>No rooms created yet.</p>
        )}
      </ul>
    </div>
  );
}

export default Rooms;
