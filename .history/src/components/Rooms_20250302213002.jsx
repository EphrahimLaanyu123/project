import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { UserCircle, LogOut, Plus, Home, Users, Calendar, Menu } from "lucide-react";

function Rooms() {
  const [myRooms, setMyRooms] = useState([]);
  const [addedRooms, setAddedRooms] = useState([]);
  const [user, setUser] = useState(null);
  const [roomName, setRoomName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUserAndRooms() {
      setIsLoading(true);
      setErrorMessage("");

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        setErrorMessage("Failed to get user information.");
        setIsLoading(false);
        return;
      }

      const userId = authData.user.id;
      setUser({ id: userId, email: authData.user.email });

      const { data: createdRooms, error: createdError } = await supabase
        .from("rooms")
        .select("*")
        .eq("created_by", userId);

      if (createdError) {
        setErrorMessage("Error fetching created rooms.");
      } else {
        setMyRooms(createdRooms || []);
      }

      const { data: memberRooms, error: memberError } = await supabase
        .from("room_members")
        .select("room_id")
        .eq("user_id", userId);

      if (memberError) {
        setErrorMessage("Error fetching joined rooms.");
        setIsLoading(false);
        return;
      }

      if (memberRooms && memberRooms.length > 0) {
        const roomIds = memberRooms.map((room) => room.room_id);

        const { data: roomsData, error: roomsError } = await supabase
          .from("rooms")
          .select("*")
          .in("id", roomIds);

        if (roomsError) {
          setErrorMessage("Error fetching room details.");
        } else {
          setAddedRooms(roomsData || []);
        }
      }

      setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className={`w-64 bg-gray-800 text-white p-5 space-y-6 ${sidebarOpen ? "block" : "hidden"} md:block`}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden mb-4 text-white">
          <Menu className="h-6 w-6" />
        </button>
        <h2 className="text-lg font-bold">Dashboard</h2>
        
        {/* User Info */}
        {user && (
          <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
            <UserCircle className="h-8 w-8 text-gray-300" />
            <div>
              <p className="text-sm font-medium">{user.username || "User"}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="space-y-3">
          <div>
            <h3 className="text-xs uppercase text-gray-400">Rooms</h3>
            <ul className="space-y-2">
              {myRooms.map((room) => (
                <li key={room.id}>
                  <button
                    onClick={() => setSelectedRoom(room)}
                    className="flex items-center space-x-2 w-full text-left hover:bg-gray-700 p-2 rounded-lg"
                  >
                    <Home className="h-5 w-5 text-gray-400" />
                    <span>{room.name}</span>
                  </button>
                </li>
              ))}
              {addedRooms.map((room) => (
                <li key={room.id}>
                  <button
                    onClick={() => setSelectedRoom(room)}
                    className="flex items-center space-x-2 w-full text-left hover:bg-gray-700 p-2 rounded-lg"
                  >
                    <Users className="h-5 w-5 text-gray-400" />
                    <span>{room.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs uppercase text-gray-400">Other</h3>
            <button className="flex items-center space-x-2 w-full text-left hover:bg-gray-700 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span>Calendar</span>
            </button>
          </div>
        </nav>

        {/* Sign Out Button */}
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 p-3 rounded-lg mt-6"
        >
          <LogOut className="h-5 w-5 mr-2" />
          Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-100 p-6">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden mb-4">
          <Menu className="h-6 w-6 text-gray-800" />
        </button>

        {/* Add Room Form */}
        <div className="bg-white shadow-sm p-6 rounded-lg">
          <h2 className="text-lg font-medium text-gray-900">Create a New Room</h2>
          <form onSubmit={addRoom} className="flex gap-3 mt-4">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              className="flex-1 border-gray-300 rounded-md p-2"
              required
            />
            <button className="bg-black text-white px-4 py-2 rounded-md flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </button>
          </form>
        </div>

        {/* Room Details */}
        {selectedRoom && (
          <div className="mt-6 bg-white shadow-sm p-6 rounded-lg">
            <h2 className="text-lg font-medium text-gray-900">Room: {selectedRoom.name}</h2>
            <p className="text-gray-600">Room details and messages go here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Rooms;
