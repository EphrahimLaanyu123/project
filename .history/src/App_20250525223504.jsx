// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Auth from "./components/Auth";
// import CreateAccount from "./components/CreateAccount";
// import Dashboard from "./components/Dashboard";
// import Rooms from "./components/Rooms";
// import RoomDetail from "./components/RoomDetail";
// import CalendarComponent from "./components/Calendar";
// import Messages from "./components/Messages";
// import TaskCalendar from "./components/TaskCalendar";

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Auth />} />
//         <Route path="/create-account" element={<CreateAccount />} />

//         <Route path="messages" element={<Messages />} />
//         <Route path="calendar" element={<TaskCalendar />} />



//         {/* Dashboard Routes */}
//         <Route path="/dashboard/*" element={<Dashboard />}>
//           <Route path="calendar" element={<CalendarComponent />} />
//           <Route path="rooms" element={<Rooms />} />
//           <Route path="rooms/:roomId" element={<RoomDetail />} />
//         </Route>
//       </Routes>
//     </Router>
//   );
// }

// export default App;





import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./components/Auth";
import CreateAccount from "./components/CreateAccount";
import Dashboard from "./components/Dashboard";
import Rooms from "./components/Rooms"; // This is correct for your rooms content
import RoomDetail from "./components/RoomDetail";
import CalendarComponent from "./components/Calendar"; // Assuming this is for a general calendar page
import Messages from "./components/Messages";
import TaskCalendar from "./components/TaskCalendar"; // Assuming this is for your tasks calendar
import MainContent from './components/MainContent';"; // Import your DashboardContent

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/create-account" element={<CreateAccount />} />

        {/* These routes will render WITHOUT the Dashboard layout (Sidebar/Header) */}
        {/* If you want Messages or TaskCalendar to be part of the Dashboard layout,
            they need to be nested under /dashboard. */}
        <Route path="messages" element={<Messages />} />
        <Route path="calendar" element={<TaskCalendar />} /> {/* Consider renaming if it's general calendar */}

        {/* Dashboard Layout Route */}
        {/* The Dashboard component now acts as the layout for its children */}
        <Route path="/dashboard" element={<Dashboard />}>
          {/* Index Route: Renders DashboardContent when the path is exactly /dashboard */}
          <Route index element={<DashboardContent />} />

          {/* Nested Routes for Dashboard */}
          {/* These components will be rendered within the <Outlet /> in Dashboard.jsx */}
          <Route path="rooms" element={<Rooms />} />
          <Route path="rooms/:roomId" element={<RoomDetail />} />
          <Route path="calendar" element={<CalendarComponent />} />
          {/* Add other dashboard-related routes here, e.g., tasks, teams */}
          {/* <Route path="tasks" element={<TasksPage />} /> */}
          {/* <Route path="teams" element={<TeamsPage />} /> */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
