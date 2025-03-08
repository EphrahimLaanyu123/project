import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./components/Auth";
import CreateAccount from "./components/CreateAccount";
import Dashboard from "./components/Dashboard";
import Rooms from "./components/Rooms";
import RoomDetail from "./components/RoomDetail";
import calenda

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/create-account" element={<CreateAccount />} />

        {/* Dashboard Routes */}
        <Route path="/dashboard/*" element={<Dashboard />}>
          <Route path="rooms" element={<Rooms />} />
          <Route path="calendar" element={<Rooms />} />
          <Route path="rooms/:roomId" element={<RoomDetail />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
