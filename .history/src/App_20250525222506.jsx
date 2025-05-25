import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./components/Auth";
import CreateAccount from "./components/CreateAccount";
import Dashboard from "./components/Dashboard";
import Rooms from "./components/Rooms";
import RoomDetail from "./components/RoomDetail";
import CalendarComponent from "./components/Calendar";
import Messages from "./components/Messages";
import TaskCalendar from "./components/TaskCalendar";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/create-account" element={<CreateAccount />} />

        <Route path="messages" element={<Messages />} />
        <Route path="calendar" element={<TaskCalendar />} />



        {/* Dashboard Routes */}
        {/* <Route path="/dashboard/*" element={<Dashboard />}>
          <Route path="calendar" element={<CalendarComponent />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="rooms/:roomId" element={<RoomDetail />} />
        </Route> */}
                        <Route path="/dashboard" element={<Dashboard />}>
                    {/* Default content for /dashboard - MainContent */}
                    <Route index element={<DashboardContent />} /> {/* See DashboardContent component below */}
                    {/* This route will render RoomsPage inside the Dashboard's Outlet */}
                    <Route path="rooms" element={<RoomsPage />} />
                    {/* Add other nested routes if needed, e.g., for /tasks, /teams */}
                    {/* <Route path="tasks" element={<TasksPage />} /> */}
                    {/* <Route path="teams" element={<TeamsPage />} /> */}
                </Route>
      </Routes>
    </Router>
  );
}

export default App;
