import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { Plus, Home } from "lucide-react";
import Dashboard from "./Dashboard"; // Import the standalone Dashboard component

function Rooms() {
  const [myRooms, setMyRooms] = useState([]);
  const [addedRooms, setAddedRooms] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchRooms() {
      setIsLoading(true);
      setErrorMessage("");

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        setErrorMessage("Failed to get user information.");
        setIsLoading(false);
        return;
      }

      const userId = authData.user.id;

      const { data: createdRooms, error: createdError } = await supabase
        .from("rooms")
        .select("*")
        .eq("created_by", userId);

      if (!createdError) setMyRooms(createdRooms || []);

      const { data: memberRooms, error: memberError } = await supabase
        .from("room_members")
        .select("room_id")
        .eq("user_id", userId);

      if (memberError) {
        setErrorMessage("Error fetching rooms you've joined.");
      } else {
        const roomIds = memberRooms.map((room) => room.room_id);
        const { data: roomsData, error: roomsError } = await supabase
          .from("rooms")
          .select("*")
          .in("id", roomIds);
        if (!roomsError) setAddedRooms(roomsData || []);
      }

      setIsLoading(false);
    }

    fetchRooms();
  }, []);

  const addRoom = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!roomName.trim()) {
      setErrorMessage("Room name cannot be empty.");
      return;
    }

    const { data, error } = await supabase
      .from("rooms")
      .insert([{ name: roomName }])
      .select();

    if (!error && data?.length > 0) {
      setMyRooms([...myRooms, data[0]]);
      setRoomName("");
    } else {
      setErrorMessage("Failed to create room. Try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {errorMessage && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Create a New Room</h2>
          <form onSubmit={addRoom} className="flex gap-3">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
              required
            />
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Room
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Home className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">My Rooms</h2>
            </div>
            {myRooms.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {myRooms.map((room) => (
                  <li key={room.id} className="py-3">
                    <button
                      onClick={() => navigate(`/dashboard/rooms/${room.id}`)}
                      className="w-full text-left flex items-center justify-between hover:bg-gray-50 p-2 rounded-md"
                    >
                      <span className="text-sm font-medium text-gray-900">{room.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">You have not created any rooms.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Rooms;
