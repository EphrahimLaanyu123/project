import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { User, UserCircle, LogOut, Plus, Home, Users } from "lucide-react";

function Rooms() {
  const [myRooms, setMyRooms] = useState([]);
  const [addedRooms, setAddedRooms] = useState([]);
  const [user, setUser] = useState(null);
  const [roomName, setRoomName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("username")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("Error fetching username:", userError);
      } else {
        setUser({ id: userId, email: authData.user.email, username: userData?.username });
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
          setErrorMessage("Error fetching details of joined rooms.");
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with user profile */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            {user && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="bg-gray-200 rounded-full p-2">
                    <UserCircle className="h-6 w-6 text-gray-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.username || "User"}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-black shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Add Room Form */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Create a New Room</h2>
          <form onSubmit={addRoom} className="flex gap-3">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              className="flex-1 shadow-sm focus:ring-black focus:border-black block w-full sm:text-sm border-gray-300 rounded-md"
              required
            />
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Room
            </button>
          </form>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* My Rooms */}
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
                      className="w-full text-left flex items-center justify-between hover:bg-gray-50 p-2 rounded-md transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900">{room.name}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Owner</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-4 text-center text-sm text-gray-500">
                <p>You haven't created any rooms yet.</p>
              </div>
            )}
          </div>

          {/* Joined Rooms */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Users className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Rooms You've Joined</h2>
            </div>
            {addedRooms.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {addedRooms.map((room) => (
                  <li key={room.id} className="py-3">
                    <button
                      onClick={() => navigate(`/rooms/${room.id}`)}
                      className="w-full text-left flex items-center justify-between hover:bg-gray-50 p-2 rounded-md transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900">{room.name}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Member</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-4 text-center text-sm text-gray-500">
                <p>You haven't joined any rooms yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Rooms;