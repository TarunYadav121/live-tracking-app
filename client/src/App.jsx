import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import LiveTracking from "./pages/LiveTracking";
import { useAuth } from "./context/AuthContext";
import TrackingHistory from "./pages/TrackingHistory";
import TrackingRouteView from "./pages/TrackingRouteView";
import ProtectedRoute from "./components/ProtectedRoute";
const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/history" element={<TrackingHistory />} />
        <Route path="/history/:id" element={<TrackingRouteView />} />
        <Route
          path="/tracking"
          element={
            <ProtectedRoute>
              <LiveTracking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <TrackingHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history/:id"
          element={
            <ProtectedRoute>
              <TrackingRouteView />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;