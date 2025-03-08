import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { LogOut, UserCircle } from "lucide-react";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUser() {
      setIsLoading(true);

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        navigate("/"); // Redirect to home if not logged in
        return;
      }

      const userId = authData.user.id;
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("username, email")
        .eq("id", userId)
        .single();

      if (!userError) {
        setUser(userData);
      }

      setIsLoading(false);
    }

    fetchUser();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow-sm py-4 text-center">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
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
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-black shadow-sm hover:bg-gray-800"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Dashboard;
