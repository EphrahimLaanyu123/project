import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./components/Auth";
import Rooms from "./components/Rooms";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/rooms" element={<Rooms />} />
      </Routes>
    </Router>
  );
}
