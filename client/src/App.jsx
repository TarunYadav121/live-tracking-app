import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { useMap } from "react-leaflet";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
const startIcon = L.divIcon({
  html: `<div style="
    width:14px;
    height:14px;
    background:#22c55e;
    border:2px solid white;
    border-radius:50%;
    box-shadow:0 0 5px rgba(0,0,0,0.5);
  "></div>`,
  className: "",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});
const currentIcon = L.divIcon({
  html: `<div style="font-size:30px;">📍</div>`,
  className: "",
  iconSize: [40, 40],
});
const socket = io("http://localhost:5000");

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
  const [route, setRoute] = useState([]);
  const [joined, setJoined] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [status, setStatus] = useState("Not connected");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [userConnected, setUserConnected] = useState(false);
  // const [startLocation, setStartLocation] = useState(null);
  const startPoint = route.length > 0 ? route[0] : null;
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
        const newPosition = [data.latitude, data.longitude];

        // setStartLocation((prev) => prev || newPosition);

        setUserLocation(newPosition);
        setRoute((prev) => [...prev, newPosition]);

        setLastUpdated(new Date().toLocaleTimeString());
        setUserConnected(true);
        setStatus("Receiving live user location");

      });
      socket.on("user-status", (data) => {
        if (data.role === "user" && data.status === "disconnected") {
          setStatus("User disconnected");
          setUserConnected(false);
          setUserLocation(null);
          setRoute([]);
          setLastUpdated(null);
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
        <div style={{ marginBottom: "30px" }}>
          <h1 style={styles.title}>Live Tracking Dashboard</h1>
          <p style={styles.subtitle}>
            Real-time User to Vendor Location Tracking
          </p>
        </div>

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

            {role === "vendor" && (
              <div
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  marginBottom: "15px",
                  fontWeight: "bold",
                  background: userConnected ? "#065f46" : "#7f1d1d",
                  color: "white",
                  textAlign: "center",
                }}
              >
                {userConnected
                  ? "🟢 User Connected"
                  : "🔴 User Not Connected"}
              </div>
            )}

            {role === "user" && (
              <div style={styles.messageBox}>
                Your live location is being shared with the vendor.
              </div>
            )}

            {role === "vendor" && (
              <div style={styles.dashboardLayout}>
                <div style={styles.leftPanel}>
                  <h3 style={styles.panelTitle}>📦 Tracking Information</h3>

                  <div style={styles.infoRow}>
                    <span>Connection</span>
                    <strong>{userConnected ? "🟢 Online" : "🔴 Offline"}</strong>
                  </div>

                  <div style={styles.infoRow}>
                    <span>Updates</span>
                    <strong>{route.length}</strong>
                  </div>

                  <div style={styles.infoRow}>
                    <span>Last Updated</span>
                    <strong>{lastUpdated || "--"}</strong>
                  </div>

                  <div style={styles.infoRow}>
                    <span>Latitude</span>
                    <strong>{userLocation ? userLocation[0].toFixed(5) : "--"}</strong>
                  </div>

                  <div style={styles.infoRow}>
                    <span>Longitude</span>
                    <strong>{userLocation ? userLocation[1].toFixed(5) : "--"}</strong>
                  </div>
                </div>

                <div style={styles.rightPanel}>
                  <div style={styles.messageBox}>
                    {userLocation
                      ? "User live location is being tracked."
                      : "Waiting for user location..."}
                  </div>

                  <div style={styles.legendBox}>
                    <span>🟢 Start Point</span>
                    <span>📍 Current Location</span>
                    <span>🔵 Route Path</span>
                  </div>

                  <div style={styles.mapWrapper}>
                    <MapContainer
                      center={userLocation || [28.6139, 77.209]}
                      zoom={13}
                      style={{ height: "450px", width: "100%" }}
                    >
                      <MapUpdater position={userLocation} />

                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                      {route.length > 1 && <Polyline positions={route} />}

                      {startPoint && (
                        <Marker position={startPoint} icon={startIcon}>
                          <Popup>
                            <strong>🟢 Journey Started Here</strong>
                          </Popup>
                        </Marker>
                      )}

                      {userLocation && (
                        <Marker position={userLocation} icon={currentIcon}>
                          <Popup>
                            <div>
                              <strong>📍 Live User Location</strong>
                              <br />
                              Latitude: {userLocation[0].toFixed(5)}
                              <br />
                              Longitude: {userLocation[1].toFixed(5)}
                              <br />
                              Updated: {lastUpdated}
                            </div>
                          </Popup>
                        </Marker>
                      )}
                    </MapContainer>
                  </div>
                </div>
              </div>
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
    padding: "14px 25px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  },
  dashboardLayout: {
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    gap: "12px",
    alignItems: "start",
  },


  leftPanel: {
    background: "#0f172a",
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid #334155",
    height: "fit-content",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #1e293b",
    fontSize: "14px",
  },

  panelTitle: {
    marginBottom: "10px",
    fontSize: "16px",
  },

  panelItem: {
    background: "#111827",
    padding: "6px 8px",
    borderRadius: "8px",
    marginBottom: "6px",
  },

  rightPanel: {
    width: "100%",
  },

  title: {
    textAlign: "center",
    fontSize: "2.3rem",
    fontWeight: "700",
    margin: 0,
    lineHeight: "1",
  },

  subtitle: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: "0.95rem",
    marginTop: "6px",
    marginBottom: "16px",
    lineHeight: "1.2",
  },
  summaryItem: {
    background: "#111827",
    padding: "15px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "90px",
    border: "1px solid #374151",
  },
  summaryBox: {
    background: "#0f172a",
    padding: "18px",
    borderRadius: "14px",
    marginBottom: "20px",
    border: "1px solid #334155",
  },

  summaryTitle: {
    marginTop: 0,
    marginBottom: "15px",
    textAlign: "center",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
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
    gap: "12px",
    marginBottom: "12px",
  },
  infoBox: {
    background: "#111827",
    padding: "10px",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
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
    padding: "9px",
    borderRadius: "10px",
    marginBottom: "10px",
    textAlign: "center",
  },
  mapWrapper: {
    borderRadius: "14px",
    overflow: "hidden",
    border: "1px solid #334155",
  },
  legendBox: {
    display: "flex",
    justifyContent: "center",
    gap: "18px",
    background: "#0f172a",
    padding: "9px",
    borderRadius: "10px",
    marginBottom: "10px",
    fontWeight: "bold",
    flexWrap: "wrap",
  },
};

export default App;