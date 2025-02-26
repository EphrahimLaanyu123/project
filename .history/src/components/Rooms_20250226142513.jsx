import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Rooms() {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    async function fetchRooms() {
      const { data, error } = await supabase.from("rooms").select("*");
      if (error) console.error(error);
      else setRooms(data);
    }
    fetchRooms();
  }, []);

  return (
    <div>
      <h2>Rooms</h2>
      <ul>
        {rooms.map((room) => (
          <li key={room.id}>{room.name}</li>
        ))}
      </ul>
    </div>
  );
}
