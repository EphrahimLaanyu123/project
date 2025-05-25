// App.js (or wherever your main routing is configured)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard'; // Your Dashboard component
import Rooms from './components/Rooms';       // Your Rooms component
import MyTasks from './components/MyTasks';   // Your MyTasks component
import Teams from './components/Teams';       // Your Teams component
// Import other components if you have a public home page, login, etc.

function App() {
  return (
    <Router>
      <Routes>
        {/*
          Your login/signup route could be here.
          For example: <Route path="/login" element={<LoginPage />} />
          Or your public home page: <Route path="/" element={<HomePage />} />
        */}

        {/* Dashboard as a Layout Route */}
        <Route path="/dashboard" element={<Dashboard />}>
          {/*
            This is the default content for /dashboard.
            When you navigate to `/dashboard` directly, this component will render inside Dashboard's <Outlet />.
            We can make a new component for the dashboard's "home" content.
          */}
          <Route index element={<DashboardHomeContent />} />

          {/* Child routes that will render within the Dashboard's <Outlet /> */}
          <Route path="rooms" element={<Rooms />} />
          <Route path="tasks" element={<MyTasks />} />
          <Route path="teams" element={<Teams />} />

          {/* Optional: Redirect from /dashboard/ to /dashboard if needed */}
          <Route path="" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Add any other top-level routes here, e.g., error pages */}
      </Routes>
    </Router>
  );
}

export default App;