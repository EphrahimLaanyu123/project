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
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">Chat Rooms</h1>
          <div className="user-actions">
            <div className="user-profile">
              <UserCircle className="user-icon" />
              <span className="username">{user?.username || user?.email || "Guest"}</span>
            </div>
            <button onClick={signOut} className="sign-out-btn">
              <LogOut className="logout-icon" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="main-content">
        {/* Error Message */}
        {errorMessage && (
          <div className="error-message">
            <div className="error-icon">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="error-text">{errorMessage}</p>
          </div>
        )}

        {/* Add Room Form */}
        <div className="card add-room-card">
          <h2 className="card-title">
            <Plus className="icon" />
            Create New Room
          </h2>
          <form onSubmit={addRoom} className="add-room-form">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter a room name..."
              className="room-input"
              required
            />
            <button type="submit" className="primary-btn">
              <Plus className="btn-icon" />
              Create
            </button>
          </form>
        </div>

        {/* Rooms Grid */}
        <div className="rooms-grid">
          {/* My Rooms */}
          <div className="card rooms-section">
            <div className="section-header">
              <Home className="section-icon" />
              <h2 className="section-title">My Rooms</h2>
            </div>
            {myRooms.length > 0 ? (
              <div className="rooms-list">
                {myRooms.map((room) => (
                  <div 
                    key={room.id} 
                    className="room-card owner-card"
                    onClick={() => navigate(`/rooms/${room.id}`)}
                  >
                    <h3 className="room-name">{room.name}</h3>
                    <div className="room-footer">
                      <span className="room-badge">Owner</span>
                      <div className="room-icon"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No rooms created yet</p>
              </div>
            )}
          </div>

          {/* Joined Rooms */}
          <div className="card rooms-section">
            <div className="section-header">
              <Users className="section-icon" />
              <h2 className="section-title">Joined Rooms</h2>
            </div>
            {addedRooms.length > 0 ? (
              <div className="rooms-list">
                {addedRooms.map((room) => (
                  <div 
                    key={room.id} 
                    className="room-card member-card"
                    onClick={() => navigate(`/dashboard/rooms/${room.id}`)}
                  >
                    <h3 className="room-name">{room.name}</h3>
                    <div className="room-footer">
                      <span className="room-badge">Member</span>
                      <div className="room-icon"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No joined rooms yet</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Rooms;

// Add this CSS
<style jsx>{`
  /* Base Styles */
  :root {
    --primary: #4f46e5;
    --primary-light: #6366f1;
    --primary-dark: #4338ca;
    --secondary: #10b981;
    --danger: #ef4444;
    --light: #f9fafb;
    --dark: #1f2937;
    --gray: #6b7280;
    --light-gray: #e5e7eb;
    --white: #ffffff;
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Inter', -apple-system, sans-serif;
    background-color: #f5f7fa;
    color: var(--dark);
  }

  /* Layout */
  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .main-content {
    flex: 1;
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }

  /* Header */
  .app-header {
    background-color: var(--white);
    box-shadow: var(--shadow-sm);
    padding: 1rem 2rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1400px;
    margin: 0 auto;
  }

  .app-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--dark);
  }

  .user-actions {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .user-profile {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .user-icon {
    color: var(--gray);
    width: 24px;
    height: 24px;
  }

  .username {
    font-weight: 500;
  }

  .sign-out-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: var(--light);
    border: 1px solid var(--light-gray);
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .sign-out-btn:hover {
    background-color: var(--light-gray);
  }

  .logout-icon {
    width: 18px;
    height: 18px;
  }

  /* Loading */
  .loading-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-left-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Cards */
  .card {
    background-color: var(--white);
    border-radius: 10px;
    box-shadow: var(--shadow-sm);
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .card-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Forms */
  .add-room-form {
    display: flex;
    gap: 1rem;
  }

  .room-input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 1px solid var(--light-gray);
    border-radius: 6px;
    font-size: 1rem;
    transition: all 0.2s;
  }

  .room-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
  }

  /* Buttons */
  .primary-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background-color: var(--primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .primary-btn:hover {
    background-color: var(--primary-light);
  }

  .btn-icon {
    width: 18px;
    height: 18px;
  }

  /* Error Message */
  .error-message {
    background-color: #fef2f2;
    color: #b91c1c;
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .error-icon {
    flex-shrink: 0;
  }

  .error-icon svg {
    width: 20px;
    height: 20px;
  }

  .error-text {
    font-size: 0.95rem;
  }

  /* Rooms Grid */
  .rooms-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  @media (min-width: 1024px) {
    .rooms-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  /* Rooms Section */
  .section-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .section-icon {
    color: var(--gray);
    width: 20px;
    height: 20px;
  }

  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
  }

  /* Room Cards */
  .rooms-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }

  .room-card {
    border-radius: 8px;
    padding: 1.25rem;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid var(--light-gray);
  }

  .room-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .owner-card {
    border-top: 3px solid var(--primary);
  }

  .member-card {
    border-top: 3px solid var(--secondary);
  }

  .room-name {
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 1rem;
  }

  .room-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .room-badge {
    font-size: 0.75rem;
    font-weight: 500;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
  }

  .owner-card .room-badge {
    background-color: #eef2ff;
    color: var(--primary);
  }

  .member-card .room-badge {
    background-color: #ecfdf5;
    color: var(--secondary);
  }

  .room-icon {
    width: 24px;
    height: 24px;
    background-color: var(--light-gray);
    border-radius: 50%;
  }

  /* Empty State */
  .empty-state {
    padding: 2rem 1rem;
    text-align: center;
    color: var(--gray);
    font-size: 0.95rem;
  }
`}</style>