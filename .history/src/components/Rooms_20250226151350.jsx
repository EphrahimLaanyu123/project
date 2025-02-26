import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { supabase } from "../supabase";

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const navigate = useNavigate(); // Initialize navigate

  useEffect(() => {
    async function fetchRooms() {
      const { data, error } = await supabase.from("rooms").select("*");
      if (error) console.error(error);
      else setRooms(data);
    }
    fetchRooms();
  }, []);

  // Sign Out Function
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/"); // Redirect to home after sign out
  };

  return (
    <div>
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
