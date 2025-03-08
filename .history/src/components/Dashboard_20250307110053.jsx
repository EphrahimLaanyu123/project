import { Link, Routes, Route, Outlet } from "react-router-dom";
import Rooms from "./Rooms";
import RoomDetail from "./RoomDetail";

const Dashboard = () => {
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
