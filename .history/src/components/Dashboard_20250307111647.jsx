import { Link, Routes, Route, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

import Rooms from "./Rooms";
import RoomDetail from "./RoomDetail";

const Dashboard = () => {
      const [user, setUser] = useState(null);
      const [isLoading, setIsLoading] = useState(true);

    
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
    <div className="flex h-screen">
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
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold">Dashboard</h2>
        <nav className="mt-4">
          <ul>
            <li>
              <Link to="/dashboard/rooms" className="block py-2 px-4 hover:bg-gray-700">
                Rooms
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <Outlet /> {/* Renders nested routes */}
      </main>
    </div>
  );
};

export default Dashboard;
