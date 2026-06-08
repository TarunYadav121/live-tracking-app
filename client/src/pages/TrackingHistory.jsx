import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const TrackingHistory = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/tracking/history", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setSessions(data));
  }, [token]);

  return (
    <div style={styles.page}>
      <h1>Tracking History</h1>

      {sessions.length === 0 ? (
        <p>No tracking history found.</p>
      ) : (
        sessions.map((session) => (
          <div key={session._id} style={styles.card}>
            <h3>Tracking ID: {session.trackingId}</h3>
            <p>User: {session.userId?.name || "Unknown"}</p>
            <p>Status: {session.status}</p>
            <p>Route Points: {session.route?.length}</p>

            <button
              style={styles.button}
              onClick={() => navigate(`/history/${session._id}`)}
            >
              View Route
            </button>
          </div>
        ))
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
    padding: "18px",
    borderRadius: "12px",
    marginBottom: "15px",
  },
  button: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
  },
};

export default TrackingHistory;