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
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showChatModal, setShowChatModal] = useState(false);
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

  const fetchRoomDetails = async (roomId) => {
    const { data, error } = await supabase.from("rooms").select("*").eq("id", roomId).single();
    if (error) {
      setErrorMessage("Failed to load room details.");
      return;
    }
    setSelectedRoom(data);
    fetchRoomMembers(roomId);
    fetchTasks(roomId);
  };

  const fetchRoomMembers = async (roomId) => {
    const { data: roomMembersData, error } = await supabase
      .from("room_members")
      .select("user_id")
      .eq("room_id", roomId);

    if (error) {
      setErrorMessage("Failed to load room members.");
      return;
    }

    const userIds = roomMembersData.map((member) => member.user_id);

    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("username, id")
      .in("id", userIds);

    if (usersError) {
      setErrorMessage("Failed to load user details.");
      return;
    }

    setMembers(usersData || []);
  };

  const fetchTasks = async (roomId) => {
    const { data: tasksData, error } = await supabase.from("tasks").select("*").eq("room_id", roomId);
    if (error) {
      setErrorMessage("Failed to load tasks.");
      return;
    }
    setTasks(tasksData);
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

        {user && (
          <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
            <UserCircle className="h-8 w-8 text-gray-300" />
            <div>
              <p className="text-sm font-medium">{user.email}</p>
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
                    onClick={() => fetchRoomDetails(room.id)}
                    className="flex items-center space-x-2 w-full text-left hover:bg-gray-700 p-2 rounded-lg"
                  >
                    <Home className="h-5 w-5 text-gray-400" />
                    <span>{room.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Sign Out Button */}
        <button onClick={signOut} className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 p-3 rounded-lg mt-6">
          <LogOut className="h-5 w-5 mr-2" />
          Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-100 p-6">
        {selectedRoom ? (
          <div className="bg-white shadow-sm p-6 rounded-lg">
            <h2 className="text-lg font-medium text-gray-900">Room: {selectedRoom.name}</h2>
            <h3 className="text-gray-600">Members:</h3>
            <ul className="mt-2">
              {members.map((member) => (
                <li key={member.id} className="text-gray-800">
                  {member.username}
                </li>
              ))}
            </ul>
            <h3 className="text-gray-600 mt-4">Tasks:</h3>
            <ul>
              {tasks.map((task) => (
                <li key={task.id} className="text-gray-800">
                  {task.title}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-gray-700">Select a room to view details.</p>
        )}
      </div>
    </div>
  );
}

export default Rooms;
