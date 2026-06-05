import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

const socket = io("http://localhost:5000");
import { useMap } from "react-leaflet";

function MapUpdater({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, {
        animate: true,
        duration: 2,
      });
    }
  }, [position, map]);

  return null;
}
function App() {
  const [role, setRole] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [joined, setJoined] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [status, setStatus] = useState("Not connected");

  const joinTracking = () => {
    if (!role || !trackingId) {
      alert("Please select role and enter tracking ID");
      return;
    }

    socket.emit("join-room", {
      trackingId,
      role,
    });
    setJoined(true);
    setStatus("Connected");
  };

  useEffect(() => {
    if (!joined) return;

    if (role === "user") {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const locationData = {
            trackingId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          socket.emit("send-location", locationData);
          setUserLocation([locationData.latitude, locationData.longitude]);
          setStatus("Sharing live location");
        },
        (error) => {
          setStatus("Location permission denied");
          alert("Location error: " + error.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }

    if (role === "vendor") {
      socket.on("receive-location", (data) => {
        setUserLocation([data.latitude, data.longitude]);
        setStatus("Receiving live user location");
      });
      socket.on("user-status", (data) => {
        if (data.role === "user" && data.status === "disconnected") {
          setStatus("User disconnected");
          setUserLocation(null);
        }
      });
    }

    return () => {
      socket.off("receive-location");
      socket.off("user-status");
    };
  }, [joined, role, trackingId]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Live Tracking App</h1>
        <p style={styles.subtitle}>Real-time User to Vendor location tracking</p>

        {!joined ? (
          <div style={styles.form}>
            <label style={styles.label}>Select Role</label>
            <select
              style={styles.input}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Choose role</option>
              <option value="user">User</option>
              <option value="vendor">Vendor</option>
            </select>

            <label style={styles.label}>Tracking ID</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Example: order123"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
            />

            <button style={styles.button} onClick={joinTracking}>
              Join Tracking
            </button>
          </div>
        ) : (
          <>
            <div style={styles.infoGrid}>
              <div style={styles.infoBox}>
                <span style={styles.infoLabel}>Role</span>
                <strong>{role.toUpperCase()}</strong>
              </div>

              <div style={styles.infoBox}>
                <span style={styles.infoLabel}>Tracking ID</span>
                <strong>{trackingId}</strong>
              </div>

              <div style={styles.infoBox}>
                <span style={styles.infoLabel}>Status</span>
                <strong>{status}</strong>
              </div>
            </div>

            {userLocation && (
              <div style={styles.locationBox}>
                <p>Latitude: {userLocation[0]}</p>
                <p>Longitude: {userLocation[1]}</p>
              </div>
            )}

            {role === "user" && (
              <div style={styles.messageBox}>
                Your live location is being shared with the vendor.
              </div>
            )}

            {role === "vendor" && (
              <>
                <div style={styles.messageBox}>
                  {userLocation
                    ? "User live location is being tracked."
                    : "Waiting for user location..."}
                </div>

                <div style={styles.mapWrapper}>
                  <MapContainer
                    center={userLocation || [28.6139, 77.209]}
                    zoom={13}
                    style={{ height: "500px", width: "100%" }}
                  >
                    <MapUpdater position={userLocation} />

                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {userLocation && (
                      <Marker position={userLocation}>
                        <Popup>User Live Location</Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#111827",
    color: "#f9fafb",
    padding: "30px",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    maxWidth: "1100px",
    margin: "0 auto",
    background: "#1f2937",
    borderRadius: "16px",
    padding: "25px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  },
  title: {
    textAlign: "center",
    marginBottom: "8px",
  },
  subtitle: {
    textAlign: "center",
    color: "#9ca3af",
    marginBottom: "30px",
  },
  form: {
    maxWidth: "400px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  label: {
    fontWeight: "bold",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #374151",
    fontSize: "16px",
  },
  button: {
    marginTop: "10px",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
    marginBottom: "20px",
  },
  infoBox: {
    background: "#111827",
    padding: "15px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  infoLabel: {
    color: "#9ca3af",
    fontSize: "14px",
  },
  locationBox: {
    background: "#0f172a",
    padding: "12px",
    borderRadius: "10px",
    marginBottom: "15px",
  },
  messageBox: {
    background: "#065f46",
    padding: "12px",
    borderRadius: "10px",
    marginBottom: "15px",
    textAlign: "center",
  },
  mapWrapper: {
    overflow: "hidden",
    borderRadius: "14px",
    border: "2px solid #374151",
  },
};

export default App;