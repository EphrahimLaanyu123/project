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

import { UserCircle, LogOut, Plus, Home, Users, MessageSquare } from "lucide-react"; // Added MessageSquare for card icon

import './Rooms.css'; // Import the CSS file

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
      <div className="rooms-loading-screen">
        <div className="rooms-spinner"></div>
        <p className="rooms-loading-message">Loading your collaborative spaces...</p>
      </div>
    );
  }

  return (
    <div className="rooms-container">
      {/* Header */}
      <header className="rooms-header">
        <div className="rooms-header-content">
          <h1 className="rooms-header-title">Nexus Rooms</h1>
          <div className="rooms-header-user-actions">
            <div className="rooms-user-profile">
              <UserCircle className="rooms-icon-user-circle" />
              <span className="rooms-username">{user?.username || user?.email || "Guest"}</span>
            </div>
            <button
              onClick={signOut}
              className="rooms-sign-out-button"
            >
              <LogOut className="rooms-icon-logout" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="rooms-main-content">
        {/* Error Message */}
        {errorMessage && (
          <div className="rooms-error-message">
            <div className="rooms-error-message-icon">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="rooms-error-message-text">
              <p className="rooms-error-message-title">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Add Room Form */}
        <section className="rooms-add-room-section">
          <h2 className="rooms-add-room-title">
            <Plus className="rooms-icon-plus-large" />
            Forge a New Nexus Room
          </h2>
          <form onSubmit={addRoom} className="rooms-add-room-form">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter a unique room name, e.g., 'Quantum Computing Research'"
              className="rooms-input-field"
              required
            />
            <button
              type="submit"
              className="rooms-create-room-button"
            >
              <Plus className="rooms-icon-plus-small" />
              Create Room
            </button>
          </form>
        </section>

        {/* Rooms Grid */}
        <div className="rooms-grid">
          {/* My Rooms Section */}
          <section className="rooms-section">
            <h2 className="rooms-section-title rooms-section-title--my-rooms">
              <Home className="rooms-icon-section" />
              My Private Nexuses
            </h2>
            {myRooms.length > 0 ? (
              <div className="rooms-list">
                {myRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => navigate(`/rooms/${room.id}`)}
                    className="rooms-card rooms-card--owner"
                  >
                    <div className="rooms-card-header">
                      <h3 className="rooms-card-title">{room.name}</h3>
                      <MessageSquare className="rooms-icon-card rooms-icon-card--owner" />
                    </div>
                    <span className="rooms-card-badge rooms-card-badge--owner">
                      Owner
                    </span>
                    <p className="rooms-card-description">Your personal space</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rooms-empty-state">
                <p>No rooms created yet.</p>
                <p className="rooms-empty-state-text">Start by creating your first private nexus above!</p>
              </div>
            )}
          </section>

          {/* Joined Rooms Section */}
          <section className="rooms-section">
            <h2 className="rooms-section-title rooms-section-title--joined-rooms">
              <Users className="rooms-icon-section" />
              Shared Nexuses
            </h2>
            {addedRooms.length > 0 ? (
              <div className="rooms-list">
                {addedRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => navigate(`/dashboard/rooms/${room.id}`)}
                    className="rooms-card rooms-card--member"
                  >
                    <div className="rooms-card-header">
                      <h3 className="rooms-card-title">{room.name}</h3>
                      <MessageSquare className="rooms-icon-card rooms-icon-card--member" />
                    </div>
                    <span className="rooms-card-badge rooms-card-badge--member">
                      Member
                    </span>
                    <p className="rooms-card-description">A collaborative space</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rooms-empty-state">
                <p>No shared rooms yet.</p>
                <p className="rooms-empty-state-text">Join a room or get invited to see it here!</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Rooms;