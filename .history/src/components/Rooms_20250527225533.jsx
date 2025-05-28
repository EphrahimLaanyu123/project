import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { UserCircle, LogOut, Plus, Home, Users, ChevronDown } from "lucide-react";

function Rooms() {
  const [myRooms, setMyRooms] = useState([]);
  const [addedRooms, setAddedRooms] = useState([]);
  const [user, setUser] = useState(null);
  const [roomName, setRoomName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [roomUsers, setRoomUsers] = useState({}); // { roomId: [users] }
  const [loadingUsers, setLoadingUsers] = useState({}); // { roomId: boolean }
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

  const fetchRoomUsers = async (roomId) => {
    if (roomUsers[roomId]) return; // Already fetched
    
    setLoadingUsers(prev => ({ ...prev, [roomId]: true }));
    
    try {
      const { data: members, error } = await supabase
        .from("room_members")
        .select("user_id")
        .eq("room_id", roomId);

      if (error) throw error;

      const userIds = members.map(m => m.user_id);
      const { data: users, error: userError } = await supabase
        .from("users")
        .select("id, username, email")
        .in("id", userIds);

      if (userError) throw userError;

      setRoomUsers(prev => ({ ...prev, [roomId]: users }));
    } catch (err) {
      console.error("Error fetching room users:", err);
      setErrorMessage("Failed to load room members");
    } finally {
      setLoadingUsers(prev => ({ ...prev, [roomId]: false }));
    }
  };

  const toggleUsersDropdown = async (roomId) => {
    if (!roomUsers[roomId]) {
      await fetchRoomUsers(roomId);
    }
    setRoomUsers(prev => ({
      ...prev,
      [roomId]: prev[roomId] ? null : prev[roomId] // Toggle visibility
    }));
  };

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
            <div className="flex items-center gap-4">
              {user?.username && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <UserCircle className="h-5 w-5" />
                  <span>{user.username}</span>
                </div>
              )}
              <button
                onClick={signOut}
                className="text-sm text-gray-600 hover:text-red-500 flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
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
                  className="flex-1 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create
                </button>
              </form>
            </div>

            {/* Room Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* My Rooms */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center mb-4">
                  <Home className="h-5 w-5 text-amber-500 mr-2" />
                  My Rooms
                </h2>
                {myRooms.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {myRooms.map((room) => (
                      <div key={room.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">{room.name}</h3>
                              <p className="text-sm text-gray-500 mt-1">You created this room</p>
                            </div>
                            <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center">
                              <Home className="h-3 w-3 mr-1" />
                              Owner
                            </span>
                          </div>
                          
                          <div className="mt-4">
                            <button
                              onClick={() => toggleUsersDropdown(room.id)}
                              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                              disabled={loadingUsers[room.id]}
                            >
                              {loadingUsers[room.id] ? (
                                "Loading members..."
                              ) : (
                                <>
                                  <span>Show members</span>
                                  <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${roomUsers[room.id] ? 'rotate-180' : ''}`} />
                                </>
                              )}
                            </button>
                            
                            {roomUsers[room.id] && (
                              <div className="mt-2 border-t pt-3">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                  Room Members
                                </h4>
                                <ul className="space-y-2">
                                  {roomUsers[room.id].map(user => (
                                    <li key={user.id} className="flex items-center">
                                      <UserCircle className="h-4 w-4 text-gray-400 mr-2" />
                                      <span className="text-sm text-gray-700">
                                        {user.username || user.email}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-3 flex justify-end">
                          <button
                            onClick={() => navigate(`/dashboard/rooms/${room.id}`)}
                            className="text-sm text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-md"
                          >
                            Enter Room
                          </button>
                        </div>
                      </div>
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
                <h2 className="text-xl font-bold text-gray-900 flex items-center mb-4">
                  <Users className="h-5 w-5 text-emerald-500 mr-2" />
                  Joined Rooms
                </h2>
                {addedRooms.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {addedRooms.map((room) => (
                      <div key={room.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">{room.name}</h3>
                              <p className="text-sm text-gray-500 mt-1">You're a member of this room</p>
                            </div>
                            <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              Member
                            </span>
                          </div>
                          
                          <div className="mt-4">
                            <button
                              onClick={() => toggleUsersDropdown(room.id)}
                              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                              disabled={loadingUsers[room.id]}
                            >
                              {loadingUsers[room.id] ? (
                                "Loading members..."
                              ) : (
                                <>
                                  <span>Show members</span>
                                  <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${roomUsers[room.id] ? 'rotate-180' : ''}`} />
                                </>
                              )}
                            </button>
                            
                            {roomUsers[room.id] && (
                              <div className="mt-2 border-t pt-3">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                  Room Members
                                </h4>
                                <ul className="space-y-2">
                                  {roomUsers[room.id].map(user => (
                                    <li key={user.id} className="flex items-center">
                                      <UserCircle className="h-4 w-4 text-gray-400 mr-2" />
                                      <span className="text-sm text-gray-700">
                                        {user.username || user.email}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-3 flex justify-end">
                          <button
                            onClick={() => navigate(`/dashboard/rooms/${room.id}`)}
                            className="text-sm text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-md"
                          >
                            Enter Room
                          </button>
                        </div>
                      </div>
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