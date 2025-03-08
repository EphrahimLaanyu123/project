import { Link, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { LogOut, UserCircle, LayoutDashboard } from "lucide-react";

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
      <div className="dashboard min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-black rounded-full animate-spin border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 shadow-lg fixed h-full transition-all duration-300 ease-in-out">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <LayoutDashboard className="h-8 w-8 text-black" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
              Dashboard
            </h2>
          </div>
          <nav>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/dashboard/rooms"
                  className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
                >
                  <span className="text-lg font-medium group-hover:translate-x-1 transition-transform duration-200">
                    Rooms
                  </span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex flex-col flex-1 ml-72">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 fixed top-0 left-72 right-0 z-10">
          <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.username || "User"}
            </h1>
            {user && (
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-2 shadow-md">
                    <UserCircle className="h-7 w-7 text-gray-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{user.username || "User"}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="inline-flex items-center px-4 py-2 border-2 border-gray-900 text-sm font-medium rounded-lg text-gray-900 bg-transparent hover:bg-gray-900 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8 mt-[73px] overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;