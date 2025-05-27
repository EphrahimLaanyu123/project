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
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
          <p className="mt-4 text-lg text-gray-700">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 font-inter">
      {/* Header */}
      <header className="bg-indigo-700 shadow-md py-4 px-4 sm:px-6 lg:px-8 rounded-b-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Your Rooms</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-white">
              <UserCircle className="h-7 w-7 mr-2" />
              <span className="font-medium">{user?.username || user?.email || "Guest"}</span>
            </div>
            <button
              onClick={signOut}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200 ease-in-out"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Error Message */}
        {errorMessage && (
          <div className="mb-8 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-base font-medium">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Add Room Form */}
        <section className="bg-white rounded-xl shadow-lg p-8 mb-10 border border-gray-200 transition-all duration-300 ease-in-out transform hover:scale-[1.01]">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <Plus className="h-6 w-6 mr-3 text-indigo-600" />
            Create a New Room
          </h2>
          <form onSubmit={addRoom} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter a descriptive room name, e.g., 'Marketing Brainstorm'"
              className="flex-1 px-5 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base placeholder-gray-400 transition-all duration-200 ease-in-out"
              required
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Room
            </button>
          </form>
        </section>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* My Rooms Section */}
          <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 transition-all duration-300 ease-in-out transform hover:scale-[1.01]">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <Home className="h-6 w-6 mr-3 text-green-600" />
              My Rooms
            </h2>
            {myRooms.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {myRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => navigate(`/rooms/${room.id}`)}
                    className="relative bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-lg shadow-md cursor-pointer hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 ease-in-out border border-indigo-200"
                  >
                    <h3 className="text-lg font-semibold text-indigo-800 mb-1">{room.name}</h3>
                    <span className="absolute top-3 right-3 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      Owner
                    </span>
                    <p className="text-sm text-indigo-600">Created by you</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500 text-lg bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p>You haven't created any rooms yet.</p>
                <p className="mt-2">Use the form above to create your first room!</p>
              </div>
            )}
          </section>

          {/* Joined Rooms Section */}
          <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 transition-all duration-300 ease-in-out transform hover:scale-[1.01]">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <Users className="h-6 w-6 mr-3 text-purple-600" />
              Rooms You've Joined
            </h2>
            {addedRooms.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {addedRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => navigate(`/dashboard/rooms/${room.id}`)}
                    className="relative bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-lg shadow-md cursor-pointer hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 ease-in-out border border-purple-200"
                  >
                    <h3 className="text-lg font-semibold text-purple-800 mb-1">{room.name}</h3>
                    <span className="absolute top-3 right-3 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      Member
                    </span>
                    <p className="text-sm text-purple-600">You are a member of this room</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500 text-lg bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p>You haven't joined any rooms yet.</p>
                <p className="mt-2">Explore or get invited to rooms to see them here.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Rooms;
