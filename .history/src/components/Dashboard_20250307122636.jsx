import { Link, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { LogOut, UserCircle } from "lucide-react";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUser() {
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

      if (!userError && userData) {
        setUser({ id: userId, email: authData.user.email, username: userData.username });
      }

      setIsLoading(false);
    }

    fetchUser();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-4 fixed h-full">
        <h2 className="text-xl font-bold">Dashboard</h2>
        <nav className="mt-4">
          <ul>
            <li>
              <Link to="/dashboard/rooms" className="block py-2 px-4 hover:bg-gray-700 rounded-md">
                Rooms
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex flex-col flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm w-full fixed top-0 left-64 right-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
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
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 mt-16 overflow-y-auto">
          <Outlet /> {/* Renders nested routes like Rooms */}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
