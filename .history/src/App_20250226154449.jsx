import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./components/Auth";
import CreateAccount from "./components/CreateAccount";
import Rooms from "./components/Rooms";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/rooms/:roomId" element={<RoomDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
