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
    let isMounted = true;

    async function fetchUserAndRooms() {
      setIsLoading(true);
      setErrorMessage("");

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        if (isMounted) {
          setErrorMessage("Failed to get user information.");
          setIsLoading(false);
        }
        return;
      }

      const userId = authData.user.id;
      if (isMounted) {
        setUser({ id: userId, email: authData.user.email });
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("username")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("Error fetching username:", userError);
      } else if (isMounted) {
        setUser({ id: userId, email: authData.user.email, username: userData?.username });
      }

      const { data: createdRooms, error: createdError } = await supabase
        .from("rooms")
        .select("*")
        .eq("created_by", userId);

      if (createdError) {
        if (isMounted) setErrorMessage("Error fetching rooms you created.");
      } else if (isMounted) {
        setMyRooms(createdRooms || []);
      }

      const { data: memberRooms, error: memberError } = await supabase
        .from("room_members")
        .select("room_id")
        .eq("user_id", userId);

      if (memberError) {
        if (isMounted) {
          setErrorMessage("Error fetching joined rooms.");
          setIsLoading(false);
        }
        return;
      }

      if (memberRooms?.length > 0) {
        const roomIds = memberRooms.map((room) => room.room_id);
        const { data: roomsData, error: roomsError } = await supabase
          .from("rooms")
          .select("*")
          .in("id", roomIds);

        if (roomsError) {
          if (isMounted) setErrorMessage("Error fetching details of joined rooms.");
        } else if (isMounted) {
          setAddedRooms(roomsData || []);
        }
      }

      if (isMounted) setIsLoading(false);
    }

    fetchUserAndRooms();

    return () => {
      isMounted = false;
    };
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
      setMyRooms((prev) => [...prev, data[0]]);
      setRoomName("");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Your Spaces</h1>
            <button
              onClick={signOut}
              className="text-sm text-gray-600 hover:text-red-500 flex items-center gap-1"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading */}
        {isLoading ? (
          <div className="text-center text-gray-500 text-lg">Loading...</div>
        ) : (
          <>
            {/* Error Message */}
            {errorMessage && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex items-start">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="ml-3 text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Add Room Form */}
            <div className="bg-white shadow-md rounded-xl p-6 mb-8">
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
                  className="flex-1 border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-1 inline" />
                  Create
                </button>
              </form>
            </div>

            {/* Room Lists */}
            <div className="flex flex-col md:flex-row justify-between mb-6">
              <div className="mb-4 md:mb-0">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Home className="h-5 w-5 text-amber-500 mr-2" />
                  My Rooms
                </h2>
                <p className="text-sm text-gray-500">Rooms you’ve created</p>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 text-emerald-500 mr-2" />
                  Joined Rooms
                </h2>
                <p className="text-sm text-gray-500">Rooms you’ve joined</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* My Rooms */}
              <div>
                {myRooms.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {myRooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => navigate(`/dashboard/rooms/${room.id}`)}
                        className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 border-l-4 border-amber-400 shadow-sm hover:shadow-md text-left"
                      >
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium text-gray-900 truncate max-w-[80%]">{room.name}</h3>
                          <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center">
                            <Home className="h-3 w-3 mr-1" />
                            Owner
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">You created this room</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 bg-white rounded-xl shadow-sm text-center">
                    <Home className="h-12 w-12 text-gray-300 mb-4 mx-auto" />
                    <p className="text-gray-500">You haven't created any rooms yet.</p>
                  </div>
                )}
              </div>

              {/* Joined Rooms */}
              <div>
                {addedRooms.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addedRooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => navigate(`/dashboard/rooms/${room.id}`)}
                        className="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 border-l-4 border-emerald-400 shadow-sm hover:shadow-md text-left"
                      >
                        <h3 className="font-medium text-gray-900">{room.name}</h3>
                        <p className="text-sm text-gray-500 mt-2">You're a member of this room</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 bg-white rounded-xl shadow-sm text-center">
                    <Users className="h-12 w-12 text-gray-300 mb-4 mx-auto" />
                    <p className="text-gray-500">You're not a member of any rooms yet.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Rooms;
