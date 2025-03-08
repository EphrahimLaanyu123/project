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


        {/* Main Content */}
        <main className="flex-1 p-6 mt-16 overflow-y-auto">
          <Outlet /> {/* Renders nested routes like Rooms */}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
