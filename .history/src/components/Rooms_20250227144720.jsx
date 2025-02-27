import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { FaUserCircle } from "react-icons/fa";

function Rooms() {
  const [myRooms, setMyRooms] = useState([]);
  const [addedRooms, setAddedRooms] = useState([]);
  const [user, setUser] = useState(null);
  const [roomName, setRoomName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUserAndRooms() {
      setErrorMessage("");

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        setErrorMessage("Failed to get user information.");
        return;
      }

      const userId = authData.user.id;
      setUser(authData.user);

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

      const { data: createdRooms, error: createdError } = await supabase
        .from("rooms")
        .select("*")
        .eq("created_by", userId);

      if (createdError) {
        setErrorMessage("Error fetching rooms you created.");
      } else {
        setMyRooms(createdRooms || []);
      }

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

  const addRoom = async (e) => {
    e.preventDefault();
    setErrorMessage("");

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

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="h-screen w-screen bg-white text-black flex flex-col items-center p-6">
      {user && (
        <div className="flex items-center mb-6 space-x-3">
          <FaUserCircle size={40} className="text-gray-700" />
          <p className="text-xl font-semibold">{user.username || "User"}</p>
        </div>
      )}

      {errorMessage && (
        <p className="bg-red-500 text-white p-3 rounded-md mb-4 text-center w-full max-w-lg">
          {errorMessage}
        </p>
      )}

      <h2 className="text-2xl font-bold mb-4">Rooms</h2>
      <button
        onClick={signOut}
        className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-md mb-4"
      >
        Sign Out
      </button>

      <form onSubmit={addRoom} className="flex flex-col items-center w-full max-w-lg mb-6">
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Enter room name"
          className="w-full p-3 rounded-md bg-gray-100 text-black focus:outline-none focus:ring-2 focus:ring-gray-500"
          required
        />
        <button
          type="submit"
          className="mt-3 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
        >
          Add Room
        </button>
      </form>

      <div className="w-full max-w-lg">
        <h3 className="text-xl font-bold mb-2">My Rooms</h3>
        {myRooms.length > 0 ? (
          <ul>
            {myRooms.map((room) => (
              <li
                key={room.id}
                className="cursor-pointer underline mb-2 hover:text-gray-600"
                onClick={() => navigate(`/rooms/${room.id}`)}
              >
                {room.name} (Created by You)
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No rooms created yet.</p>
        )}
      </div>

      <div className="w-full max-w-lg mt-4">
        <h3 className="text-xl font-bold mb-2">Rooms You've Joined</h3>
        {addedRooms.length > 0 ? (
          <ul>
            {addedRooms.map((room) => (
              <li
                key={room.id}
                className="cursor-pointer underline mb-2 hover:text-gray-600"
                onClick={() => navigate(`/rooms/${room.id}`)}
              >
                {room.name} (You are a member)
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Not added to any rooms yet.</p>
        )}
      </div>
    </div>
  );
}

export default Rooms;
