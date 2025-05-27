import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// Assuming supabase is correctly imported from '../supabase'
// import { supabase } from "../supabase"; // Keep this line if it's external

// Mock Supabase for demonstration purposes if not provided externally
// In a real application, you would use the actual supabase client.
const supabase = {
  auth: {
    getUser: async () => {
      // Simulate a logged-in user
      return { data: { user: { id: "user-123", email: "test@example.com" } }, error: null };
    },
    signOut: async () => {
      console.log("Signing out...");
      return { error: null };
    },
  },
  from: (tableName) => ({
    select: (columns) => ({
      eq: (column, value) => ({
        single: async () => {
          if (tableName === "users" && column === "id" && value === "user-123") {
            return { data: { username: "TestUser" }, error: null };
          }
          return { data: null, error: { message: "Not found" } };
        },
      }),
      in: (column, values) => ({
        // Mock data for rooms
        async then(callback) {
          if (tableName === "rooms" && column === "id") {
            const mockRooms = [
              { id: "room-456", name: "Team Collaboration" },
              { id: "room-789", name: "Project Alpha" },
            ];
            return callback({ data: mockRooms.filter(room => values.includes(room.id)), error: null });
          }
          return callback({ data: [], error: null });
        }
      }),
      async then(callback) {
        if (tableName === "rooms" && columns === "*" && column === "created_by" && value === "user-123") {
          const mockCreatedRooms = [{ id: "room-101", name: "My Personal Room", created_by: "user-123" }];
          return callback({ data: mockCreatedRooms, error: null });
        }
        if (tableName === "room_members" && columns === "room_id" && column === "user_id" && value === "user-123") {
          const mockMemberRooms = [{ room_id: "room-456" }, { room_id: "room-789" }];
          return callback({ data: mockMemberRooms, error: null });
        }
        return callback({ data: [], error: null });
      }
    }),
    insert: async (data) => {
      if (tableName === "rooms") {
        const newRoom = { ...data[0], id: `room-${Math.random().toString(36).substring(2, 9)}` };
        return { data: [newRoom], error: null };
      }
      return { data: null, error: { message: "Insert failed" } };
    },
  }),
};

import { User, UserCircle, LogOut, Plus, Home, Users, MessageSquare } from "lucide-react"; // Added MessageSquare for card icon

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

      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData?.user) {
          setErrorMessage("Failed to get user information. Please log in again.");
          navigate("/"); // Redirect to login if no user
          return;
        }

        const userId = authData.user.id;
        let fetchedUser = { id: userId, email: authData.user.email };

        // Fetch username
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("username")
          .eq("id", userId)
          .single();

        if (userError) {
          console.error("Error fetching username:", userError);
          // Don't block if username fails, proceed with email
        } else {
          fetchedUser = { ...fetchedUser, username: userData?.username || "Guest" };
        }
        setUser(fetchedUser);

        // Fetch rooms created by the user
        const { data: createdRooms, error: createdError } = await supabase
          .from("rooms")
          .select("*")
          .eq("created_by", userId);

        if (createdError) {
          setErrorMessage("Error fetching rooms you created.");
        } else {
          setMyRooms(createdRooms || []);
        }

        // Fetch rooms the user is a member of
        const { data: memberRooms, error: memberError } = await supabase
          .from("room_members")
          .select("room_id")
          .eq("user_id", userId);

        if (memberError) {
          setErrorMessage("Error fetching rooms you've joined.");
        } else if (memberRooms && memberRooms.length > 0) {
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
      } catch (error) {
        console.error("Unexpected error during room fetch:", error);
        setErrorMessage("An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserAndRooms();
  }, [navigate]); // Added navigate to dependency array

  const addRoom = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!roomName.trim() || !user) {
      setErrorMessage("Room name cannot be empty or you are not logged in.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("rooms")
        .insert([{ name: roomName, created_by: user.id }])
        .select();

      if (error) {
        setErrorMessage("Failed to create room. Please try again.");
      } else if (data?.length > 0) {
        setMyRooms((prevRooms) => [...prevRooms, data[0]]);
        setRoomName("");
      }
    } catch (error) {
      console.error("Error adding room:", error);
      setErrorMessage("An unexpected error occurred while creating the room.");
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      setErrorMessage("Failed to sign out. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-teal-500"></div>
          <p className="mt-4 text-lg text-gray-300">Loading your collaborative spaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-inter">
      {/* Header */}
      <header className="bg-gray-800 shadow-xl py-5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-white tracking-wide">Nexus Rooms</h1>
          <div className="flex items-center space-x-5">
            <div className="flex items-center text-gray-200">
              <UserCircle className="h-8 w-8 mr-2 text-teal-400" />
              <span className="font-semibold text-lg">{user?.username || user?.email || "Guest"}</span>
            </div>
            <button
              onClick={signOut}
              className="inline-flex items-center px-5 py-2 border border-transparent text-base font-medium rounded-full shadow-lg text-gray-900 bg-teal-400 hover:bg-teal-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Error Message */}
        {errorMessage && (
          <div className="mb-10 bg-red-800 border-l-4 border-red-500 text-red-100 p-5 rounded-lg shadow-xl transition-all duration-300 ease-in-out transform hover:scale-[1.01]">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-7 w-7 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-lg font-medium">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Add Room Form */}
        <section className="bg-gray-800 rounded-2xl shadow-2xl p-10 mb-12 border border-gray-700 transition-all duration-300 ease-in-out transform hover:scale-[1.01]">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
            <Plus className="h-8 w-8 mr-4 text-teal-400" />
            Forge a New Nexus Room
          </h2>
          <form onSubmit={addRoom} className="flex flex-col sm:flex-row gap-6">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter a unique room name, e.g., 'Quantum Computing Research'"
              className="flex-1 px-6 py-3 bg-gray-700 border border-gray-600 rounded-xl shadow-inner focus:ring-teal-500 focus:border-teal-500 text-lg placeholder-gray-400 text-white transition-all duration-200 ease-in-out"
              required
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-lg font-bold rounded-xl shadow-lg text-gray-900 bg-teal-500 hover:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-200 ease-in-out transform hover:-translate-y-1 hover:scale-105"
            >
              <Plus className="h-6 w-6 mr-3" />
              Create Room
            </button>
          </form>
        </section>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* My Rooms Section */}
          <section className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700 transition-all duration-300 ease-in-out transform hover:scale-[1.02]">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Home className="h-7 w-7 mr-3 text-emerald-400" />
              My Private Nexuses
            </h2>
            {myRooms.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {myRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => navigate(`/rooms/${room.id}`)}
                    className="relative bg-gray-700 p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 ease-in-out border border-emerald-600 group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-semibold text-white group-hover:text-emerald-300 transition-colors duration-200">{room.name}</h3>
                      <MessageSquare className="h-6 w-6 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-200" />
                    </div>
                    <span className="absolute bottom-3 right-3 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      Owner
                    </span>
                    <p className="text-sm text-gray-300">Your personal space</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-gray-400 text-lg bg-gray-700 rounded-xl border border-dashed border-gray-600">
                <p>No rooms created yet.</p>
                <p className="mt-3">Start by creating your first private nexus above!</p>
              </div>
            )}
          </section>

          {/* Joined Rooms Section */}
          <section className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700 transition-all duration-300 ease-in-out transform hover:scale-[1.02]">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Users className="h-7 w-7 mr-3 text-sky-400" />
              Shared Nexuses
            </h2>
            {addedRooms.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {addedRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => navigate(`/dashboard/rooms/${room.id}`)}
                    className="relative bg-gray-700 p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 ease-in-out border border-sky-600 group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-semibold text-white group-hover:text-sky-300 transition-colors duration-200">{room.name}</h3>
                      <MessageSquare className="h-6 w-6 text-sky-400 group-hover:text-sky-300 transition-colors duration-200" />
                    </div>
                    <span className="absolute bottom-3 right-3 bg-sky-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      Member
                    </span>
                    <p className="text-sm text-gray-300">A collaborative space</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-gray-400 text-lg bg-gray-700 rounded-xl border border-dashed border-gray-600">
                <p>No shared rooms yet.</p>
                <p className="mt-3">Join a room or get invited to see it here!</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Rooms;
