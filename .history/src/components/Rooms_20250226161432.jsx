import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { FaUserCircle } from "react-icons/fa";

function Rooms() {
  const [myRooms, setMyRooms] = useState([]);
  const [addedRooms, setAddedRooms] = useState([]);
  const [user, setUser] = useState(null);
  const [roomName, setRoomName] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // ✅ Store errors in state
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUserAndRooms() {
      setErrorMessage(""); // ✅ Reset error before fetching

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        setErrorMessage("Failed to get user information.");
        return;
      }

      const userId = authData.user.id;
      setUser(authData.user);

      // Fetch username
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("username")
        .eq("id", userId)
        .single();

      if (userError) {
        setErrorMessage("Error fetching username.");
      } else {
        setUser({ ...authData.user, username: userData?.username });
      }

      // Fetch rooms created by user
      const { data: createdRooms, error: createdError } = await supabase
        .from("rooms")
        .select("*")
        .eq("created_by", userId);

      if (createdError) {
        setErrorMessage("Error fetching rooms you created.");
      } else {
        setMyRooms(createdRooms || []);
      }

      // Fetch rooms where user is a member
      const { data: memberRooms, error: memberError } = await supabase
        .from("room_members")
        .select("room_id")
        .eq("user_id", userId);

      if (memberError) {
        setErrorMessage("Error fetching rooms you've joined.");
        return;
      }

      if (memberRooms.length > 0) {
        const roomIds = memberRooms.map((room) => room.room_id);

        const { data: roomsData, error: roomsError } = await supabase
          .from("rooms")
          .select("*")
          .in("id", roomIds);

        if (roomsError) {
          setErrorMessage("Error fetching details of joined rooms.");
        } else {
          setAddedRooms(roomsData || []);
        }
      }
    }

    fetchUserAndRooms();
  }, []);

  // Add a new room
  const addRoom = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // ✅ Reset error before trying to add

    if (!roomName.trim() || !user) {
      setErrorMessage("Room name cannot be empty.");
      return;
    }

    const { data, error } = await supabase
      .from("rooms")
      .insert([{ name: roomName, created_by: user.id }])
      .select();

    if (error) {
      setErrorMessage("Failed to create room. Try again.");
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
    <div style={{ padding: "20px" }}>
      {/* User Profile */}
      {user && (
        <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
          <FaUserCircle size={40} style={{ marginRight: "10px" }} />
          <p style={{ fontSize: "18px", fontWeight: "bold" }}>{user.username || "User"}</p>
        </div>
      )}

      {/* 🔴 Display Error Messages */}
      {errorMessage && (
        <p style={{ color: "red", background: "#ffe6e6", padding: "10px", borderRadius: "5px", marginBottom: "10px" }}>
          {errorMessage}
        </p>
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
              style={{ cursor: "pointer", textDecoration: "underline", marginBottom: "10px" }} 
              onClick={() => navigate(`/rooms/${room.id}`)}
            >
              {room.name} (Created by You)
            </li>
          ))}
        </ul>
      ) : (
        <p>No rooms created yet.</p>
      )}

      {/* Added Rooms */}
      <h3>Rooms You've Joined</h3>
      {addedRooms.length > 0 ? (
        <ul>
          {addedRooms.map((room) => (
            <li 
              key={room.id} 
              style={{ cursor: "pointer", textDecoration: "underline", marginBottom: "10px" }} 
              onClick={() => navigate(`/rooms/${room.id}`)}
            >
              {room.name} (You are a member)
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
