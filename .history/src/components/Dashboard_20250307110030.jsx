import { Link, Routes, Route, Outlet } from "react-router-dom";
import Rooms from "./Rooms";
import RoomDetail from "./RoomDetail";

const Dashboard = () => {
  return (
    <div className="flex h-screen">
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
        <Routes>
          <Route path="/" element={<h2>Welcome to the Dashboard</h2>} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="rooms/:roomId" element={<RoomDetail />} />
        </Routes>
        <Outlet /> {/* Renders nested routes */}
      </main>
    </div>
  );
};

export default Dashboard;
