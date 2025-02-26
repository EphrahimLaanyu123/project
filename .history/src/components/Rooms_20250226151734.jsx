import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { FaUserCircle } from "react-icons/fa"; // Import user icon

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [user, setUser] = useState(null);
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
      <button onClick={signOut} style={{ marginBottom: "20px", cursor: "pointer" }}>
        Sign Out
      </button>
      <ul>
        {rooms.map((room) => (
          <li key={room.id}>{room.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default Rooms;
