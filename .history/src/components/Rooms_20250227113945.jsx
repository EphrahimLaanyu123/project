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
    <div className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow-md">
      {/* User Profile */}
      {user && (
        <div className="flex items-center mb-4">
          <FaUserCircle size={40} className="text-gray-600 mr-2" />
          <p className="text-lg font-bold">{user.username || "User"}</p>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <p className="bg-red-100 text-red-700 px-4 py-2 rounded-md mb-4">
          {errorMessage}
        </p>
      )}

      <h2 className="text-2xl font-bold mb-4">Rooms</h2>
      <button
        onClick={signOut}
        className="mb-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
      >
        Sign Out
      </button>

      {/* Add Room Form */}
      <form onSubmit={addRoom} className="mb-4 flex gap-2">
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Enter room name"
          className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
        >
          Add Room
        </button>
      </form>

      {/* My Rooms */}
      <h3 className="text-xl font-semibold mb-2">My Rooms</h3>
      {myRooms.length > 0 ? (
        <ul className="list-disc list-inside">
          {myRooms.map((room) => (
            <li
              key={room.id}
              className="cursor-pointer text-blue-600 underline mb-2 hover:text-blue-800 transition"
              onClick={() => navigate(`/rooms/${room.id}`)}
            >
              {room.name} (Created by You)
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No rooms created yet.</p>
      )}

      {/* Added Rooms */}
      <h3 className="text-xl font-semibold mt-4 mb-2">Rooms You've Joined</h3>
      {addedRooms.length > 0 ? (
        <ul className="list-disc list-inside">
          {addedRooms.map((room) => (
            <li
              key={room.id}
              className="cursor-pointer text-blue-600 underline mb-2 hover:text-blue-800 transition"
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
  );
}

export default Rooms;
