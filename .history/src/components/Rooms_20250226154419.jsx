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
        
        if (!error) setUser({ ...user, username: data?.username });
      }
    }

    async function fetchRooms() {
      const { data, error } = await supabase.from("rooms").select("*");
      if (error) console.error(error);
      else setRooms(data);
    }

    fetchUser();
    fetchRooms();
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
    } else if (data && data.length > 0) {
      setRooms([...rooms, data[0]]);
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

      {/* List of Rooms */}
      <ul>
        {rooms.map((room) => (
          <li 
            key={room.id} 
            style={{ cursor: "pointer", textDecoration: "underline" }} 
            onClick={() => navigate(`/rooms/${room.id}`)}
          >
            {room.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Rooms;
