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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    {/* Header */}
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Your Spaces</h1>
      </div>
    </header>

    {/* Main content */}
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md animate-fadeIn">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400\" viewBox="0 0 20 20\" fill="currentColor">
                <path fillRule="evenodd\" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z\" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Room Form */}
      <div className="bg-white shadow-md rounded-xl p-6 mb-8 transition-all hover:shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Plus className="h-5 w-5 text-indigo-500 mr-2" />
          Create a New Room
        </h2>
        <form onSubmit={addRoom} className="flex gap-3">
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Enter room name"
            className="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-lg transition-all"
            required
          />
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create
          </button>
        </form>
      </div>

      {/* Section headers */}
      <div className="flex flex-col md:flex-row justify-between mb-6">
        <div className="mb-4 md:mb-0">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Crown className="h-5 w-5 text-amber-500 mr-2" />
            My Rooms
          </h2>
          <p className="text-sm text-gray-500">Rooms you've created</p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <UserPlus className="h-5 w-5 text-emerald-500 mr-2" />
            Joined Rooms
          </h2>
          <p className="text-sm text-gray-500">Rooms you're participating in</p>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* My Rooms */}
        <div className="space-y-4">
          {myRooms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myRooms.map((room) => (
                <RoomCard 
                  key={room.id} 
                  room={room} 
                  type="owner" 
                  onClick={() => navigate(`/rooms/${room.id}`)} 
                />
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={<Home className="h-12 w-12 text-gray-300" />}
              message="You haven't created any rooms yet" 
            />
          )}
        </div>

        {/* Joined Rooms */}
        <div className="space-y-4">
          {addedRooms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addedRooms.map((room) => (
                <RoomCard 
                  key={room.id} 
                  room={room} 
                  type="member" 
                  onClick={() => navigate(`/dashboard/rooms/${room.id}`)} 
                />
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={<Users className="h-12 w-12 text-gray-300" />}
              message="You haven't joined any rooms yet" 
            />
          )}
        </div>
      </div>
    </main>
  </div>
  );
}

export default Rooms;