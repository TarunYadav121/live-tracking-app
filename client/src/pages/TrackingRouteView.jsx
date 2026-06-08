import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { useAuth } from "../context/AuthContext";

const TrackingRouteView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [session, setSession] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/tracking/history/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setSession(data));
  }, [id, token]);

  if (!session) {
    return <div style={styles.page}>Loading route...</div>;
  }

  const positions = session.route.map((point) => [point.lat, point.lng]);
  const startPoint = positions[0];
  const endPoint = positions[positions.length - 1];

  return (
    <div style={styles.page}>
      <button style={styles.backButton} onClick={() => navigate("/history")}>
        ← Back to History
      </button>

      <h1>Saved Route</h1>

      <div style={styles.card}>
        <p><strong>Tracking ID:</strong> {session.trackingId}</p>
        <p><strong>User:</strong> {session.userId?.name || "Unknown"}</p>
        <p><strong>Status:</strong> {session.status}</p>
        <p><strong>Route Points:</strong> {session.route.length}</p>
      </div>

      {positions.length > 0 && (
        <MapContainer
          center={startPoint}
          zoom={13}
          style={{ height: "500px", width: "100%", borderRadius: "12px" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <Polyline positions={positions} />

          <Marker position={startPoint}>
            <Popup>Start Point</Popup>
          </Marker>

          <Marker position={endPoint}>
            <Popup>End Point</Popup>
          </Marker>
        </MapContainer>
      )}
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#111827",
    color: "white",
    padding: "30px",
  },
  card: {
    background: "#1f2937",
    padding: "16px",
    borderRadius: "12px",
    marginBottom: "20px",
  },
  backButton: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "8px",
    background: "#374151",
    color: "white",
    cursor: "pointer",
    marginBottom: "15px",
  },
};

export default TrackingRouteView;