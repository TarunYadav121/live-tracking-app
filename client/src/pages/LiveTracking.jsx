import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../App.css";

/* ── Custom map icons ─────────────────────────────────────────── */
const startIcon = L.divIcon({
    html: `<div style="
        width:14px;height:14px;
        background:#22c55e;
        border:2px solid white;
        border-radius:50%;
        box-shadow:0 0 6px rgba(0,0,0,0.6);
    "></div>`,
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
});

const currentIcon = L.divIcon({
    html: `<div style="font-size:28px;line-height:1;">📍</div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

const socket = io("http://localhost:5000");

/* ── Map auto-pan helper ──────────────────────────────────────── */
function MapUpdater({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 15, { animate: true, duration: 2 });
        }
    }, [position, map]);
    return null;
}

/* ── Main component ───────────────────────────────────────────── */
function LiveTracking() {
    const { user, token, logout } = useAuth();
    const role = user?.role;
    const [trackingId, setTrackingId] = useState("");
    const [route, setRoute] = useState([]);
    const [joined, setJoined] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [status, setStatus] = useState("Not connected");
    const [lastUpdated, setLastUpdated] = useState(null);
    const [userConnected, setUserConnected] = useState(false);
    const [trackedUserId, setTrackedUserId] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const startPoint = route.length > 0 ? route[0] : null;
    const navigate = useNavigate();

    /* ── Handlers ───────────────────────────────────────────────── */
    const joinTracking = () => {
        if (!role || !trackingId) {
            alert("Please enter a tracking ID");
            return;
        }
        socket.emit("join-room", {
            trackingId,
            role,
            userId: user._id || user.id,
            name: user.name,
        });
        setJoined(true);
        setStatus("Connected");
        setStartTime(new Date().toISOString());
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const stopTracking = async () => {
        console.log("SAVE CHECK:", { trackingId, routeLength: route.length, trackedUserId, role, token });
        if (role !== "vendor") {
            alert("Only vendor can save tracking history");
            return;
        }
        if (!trackingId || route.length === 0 || !trackedUserId) {
            alert("No tracking data available to save");
            return;
        }
        const sessionData = {
            trackingId,
            userId: trackedUserId,
            route,
            startTime,
            endTime: new Date().toISOString(),
        };
        const res = await fetch("http://localhost:5000/api/tracking/save", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(sessionData),
        });
        const data = await res.json();
        if (res.ok) {
            setStatus("Tracking saved successfully");
            setJoined(false);
            setRoute([]);
            setUserLocation(null);
            setTrackedUserId(null);
        } else {
            alert(data.message || "Failed to save tracking");
        }
    };

    /* ── Socket / geolocation effects ──────────────────────────── */
    useEffect(() => {
        if (!joined) return;

        if (role === "user") {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const locationData = {
                        trackingId,
                        userId: user._id || user.id,
                        name: user.name,
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
                { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }

        if (role === "vendor") {
            socket.on("receive-location", (data) => {
                const newPosition = [data.latitude, data.longitude];
                if (data.userId) setTrackedUserId(data.userId);
                setUserLocation(newPosition);
                setRoute((prev) => {
                    const lastPoint = prev[prev.length - 1];

                    if (!lastPoint) {
                        return [newPosition];
                    }

                    const latDiff = Math.abs(lastPoint[0] - newPosition[0]);
                    const lngDiff = Math.abs(lastPoint[1] - newPosition[1]);

                    if (latDiff < 0.00001 && lngDiff < 0.00001) {
                        return prev;
                    }

                    return [...prev, newPosition];
                });
                setLastUpdated(new Date().toLocaleTimeString());
                setUserConnected(true);
                setStatus("Receiving live user location");
            });

            socket.on("user-status", (data) => {
                if (data.role === "user" && data.status === "joined") {
                    setTrackedUserId(data.userId);
                    setUserConnected(true);
                    setStatus("User connected");
                }
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

    /* ── Render ─────────────────────────────────────────────────── */
    return (
        <div className="page">
            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-brand">
                    <div className="navbar-brand-icon">📍</div>
                    LiveTrack
                </div>
                <div className="navbar-right">
                    {joined && (
                        <span className="badge-role">{role}</span>
                    )}
                    {role === "vendor" && (
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate("/history")}
                            style={{ width: "auto" }}
                        >
                            History
                        </button>
                    )}
                    <button
                        className="btn btn-danger btn-sm"
                        onClick={handleLogout}
                        style={{ width: "auto" }}
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <div className="content">
                {/* Page header */}
                <div style={{ marginBottom: "24px" }}>
                    <h1 style={{ fontSize: "1.8rem", marginBottom: "4px" }}>
                        Live Tracking Dashboard
                    </h1>
                    <p style={{ fontSize: "14px" }}>Real-time user-to-vendor location tracking</p>
                </div>

                {/* ── Pre-join hero ─────────────────────────────────── */}
                {!joined ? (
                    <div className="hero-shell" style={heroStyles.shell}>
                        {/* ── LEFT – illustration + feature list ─────── */}
                        <div style={heroStyles.left}>
                            {/* Animated map illustration */}
                            <div className="hero-map-hide" style={heroStyles.mapIllustration}>
                                <div style={heroStyles.mapGrid} aria-hidden="true">
                                    {Array.from({ length: 35 }).map((_, i) => (
                                        <div key={i} style={heroStyles.mapCell} />
                                    ))}
                                </div>
                                {/* Fake route line */}
                                <svg style={heroStyles.routeSvg} viewBox="0 0 320 180" fill="none">
                                    <polyline
                                        points="30,140 70,110 110,120 160,80 200,90 250,55 290,40"
                                        stroke="#3b82f6"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeDasharray="6 4"
                                        opacity="0.7"
                                    />
                                    {/* Start dot */}
                                    <circle cx="30" cy="140" r="6" fill="#22c55e" stroke="white" strokeWidth="2" />
                                    {/* End ping */}
                                    <circle cx="290" cy="40" r="8" fill="#3b82f6" opacity="0.25" />
                                    <circle cx="290" cy="40" r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
                                </svg>
                                {/* Pin emoji overlay */}
                                <div style={heroStyles.pinOverlay}>📍</div>
                            </div>

                            {/* App tagline */}
                            <h2 style={heroStyles.heroTitle}>
                                Track. Monitor.<br />Deliver.
                            </h2>
                            <p style={heroStyles.heroSub}>
                                Real-time GPS tracking between users and vendors — all in one place.
                            </p>

                            {/* Feature list */}
                            <ul style={heroStyles.featureList}>
                                {[
                                    { icon: "🛰️", label: "Real-Time GPS Tracking", desc: "Sub-second location updates via WebSocket" },
                                    { icon: "🗂️", label: "Route History Storage", desc: "Every session saved and replayable anytime" },
                                    { icon: "👁️", label: "Vendor Monitoring", desc: "Full journey visibility" },
                                    { icon: "🔒", label: "Secure Authentication", desc: "JWT-protected sessions with role-based access" },
                                ].map(({ icon, label, desc }) => (
                                    <li key={label} style={heroStyles.featureItem}>
                                        <div style={heroStyles.featureIcon}>{icon}</div>
                                        <div>
                                            <div style={heroStyles.featureLabel}>{label}</div>
                                            <div style={heroStyles.featureDesc}>{desc}</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* ── RIGHT – session card ───────────────────── */}
                        <div style={heroStyles.right}>
                            {/* Welcome header */}
                            <div style={heroStyles.welcomeRow}>
                                <div style={heroStyles.avatar}>
                                    {user?.name?.[0]?.toUpperCase() ?? "U"}
                                </div>
                                <div>
                                    <div style={heroStyles.welcomeName}>
                                        Hey, {user?.name?.split(" ")[0] ?? "there"} 👋
                                    </div>
                                    <div style={heroStyles.welcomeSub}>Ready to start a session?</div>
                                </div>
                            </div>

                            {/* Role card */}
                            <div style={heroStyles.roleCard}>
                                <div style={heroStyles.roleCardLeft}>
                                    <div style={heroStyles.roleIconWrap}>
                                        {role === "vendor" ? "🏪" : "🧭"}
                                    </div>
                                    <div>
                                        <div style={heroStyles.roleTitle}>
                                            {role === "vendor" ? "Vendor Account" : "User Account"}
                                        </div>
                                        <div style={heroStyles.roleDesc}>
                                            {role === "vendor"
                                                ? "You can monitor and track users in real time."
                                                : "You will share your live GPS location."}
                                        </div>
                                    </div>
                                </div>
                                <span className={`status-pill ${role === "vendor" ? "online" : "info"}`}>
                                    {role?.toUpperCase()}
                                </span>
                            </div>

                            {/* Divider */}
                            <div style={heroStyles.divider} />

                            {/* Tracking ID input */}
                            <div className="form-group" style={{ marginBottom: "6px" }}>
                                <label className="form-label" style={{ fontSize: "13px", fontWeight: 600 }}>
                                    Tracking ID
                                </label>
                                <div style={heroStyles.inputWrapper}>
                                    <span style={heroStyles.inputIcon}>#</span>
                                    <input
                                        className="form-input"
                                        type="text"
                                        placeholder="e.g. order123"
                                        value={trackingId}
                                        onChange={(e) => setTrackingId(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && joinTracking()}
                                        style={{ paddingLeft: "36px" }}
                                    />
                                </div>
                                <span style={{ fontSize: "12px", color: "var(--text-faint)", marginTop: "6px", display: "block" }}>
                                    {role === "user"
                                        ? "Ask your vendor for the tracking ID to share your location."
                                        : "Enter the order or session ID to start monitoring."}
                                </span>
                            </div>

                            {/* Actions */}
                            <div style={heroStyles.actions}>
                                <button
                                    className="btn btn-primary"
                                    onClick={joinTracking}
                                    style={heroStyles.joinBtn}
                                >
                                    <span>🔗</span> Join Tracking Session
                                </button>

                                {role === "vendor" && (
                                    <button
                                        className="btn btn-ghost"
                                        onClick={() => navigate("/history")}
                                        style={heroStyles.historyBtn}
                                    >
                                        <span>📋</span> View History
                                    </button>
                                )}
                            </div>

                            {/* Stats strip */}
                            <div style={heroStyles.statsStrip}>
                                {[
                                    { val: "Live", label: "Updates" },
                                    { val: "256-bit", label: "Encrypted" },
                                    { val: "Socket", label: "Connection" },
                                ].map(({ val, label }) => (
                                    <div key={label} style={heroStyles.statItem}>
                                        <div style={heroStyles.statVal}>{val}</div>
                                        <div style={heroStyles.statLabel}>{label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ── Active session ─────────────────────────────── */
                    <>
                        {/* Status bar */}
                        <div style={activeStyles.statusBar}>
                            <div style={activeStyles.statusItem}>
                                <span style={activeStyles.statusLabel}>Role</span>
                                <span className={`status-pill ${role === "vendor" ? "online" : "info"}`}>
                                    {role.toUpperCase()}
                                </span>
                            </div>
                            <div style={activeStyles.statusItem}>
                                <span style={activeStyles.statusLabel}>Tracking ID</span>
                                <strong style={{ color: "var(--text)", fontSize: "14px" }}>{trackingId}</strong>
                            </div>
                            <div style={activeStyles.statusItem}>
                                <span style={activeStyles.statusLabel}>Status</span>
                                <strong style={{ color: "var(--text)", fontSize: "14px" }}>{status}</strong>
                            </div>
                        </div>

                        {/* User role – sharing message */}
                        {role === "user" && (
                            <div className="status-pill info" style={{ marginBottom: "20px", borderRadius: "var(--radius)", padding: "14px 18px", display: "block", textAlign: "center" }}>
                                📡 Your live location is being shared with the vendor.
                            </div>
                        )}

                        {/* Vendor role – main dashboard */}
                        {role === "vendor" && (
                            <>
                                {/* Connection status */}
                                <div
                                    className={`status-pill ${userConnected ? "online" : "offline"}`}
                                    style={{ marginBottom: "20px", borderRadius: "var(--radius)", padding: "12px 18px", display: "block", textAlign: "center", fontSize: "14px" }}
                                >
                                    {userConnected ? "🟢 User is connected and sending location" : "🔴 Waiting for user to connect…"}
                                </div>

                                <div className="dashboard-grid">
                                    {/* Left – info panel */}
                                    <div className="card" style={{ height: "fit-content" }}>
                                        <p className="section-title">Tracking Info</p>

                                        <div className="info-row">
                                            <span>Connection</span>
                                            <strong>{userConnected ? "🟢 Online" : "🔴 Offline"}</strong>
                                        </div>
                                        <div className="info-row">
                                            <span>Route points</span>
                                            <strong>{route.length}</strong>
                                        </div>
                                        <div className="info-row">
                                            <span>Last updated</span>
                                            <strong>{lastUpdated || "—"}</strong>
                                        </div>
                                        <div className="info-row">
                                            <span>Latitude</span>
                                            <strong>{userLocation ? userLocation[0].toFixed(5) : "—"}</strong>
                                        </div>
                                        <div className="info-row">
                                            <span>Longitude</span>
                                            <strong>{userLocation ? userLocation[1].toFixed(5) : "—"}</strong>
                                        </div>

                                        <div style={{ marginTop: "18px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                            <button className="btn btn-danger" onClick={stopTracking}>
                                                ⏹ Stop &amp; Save
                                            </button>
                                            <button
                                                className="btn btn-success"
                                                onClick={() => navigate("/history")}
                                            >
                                                📋 View History
                                            </button>
                                        </div>
                                    </div>

                                    {/* Right – map */}
                                    <div>
                                        {/* Map status */}
                                        <div className="status-pill info" style={{ marginBottom: "10px", borderRadius: "var(--radius)", padding: "10px 16px", display: "block", textAlign: "center", fontSize: "13px" }}>
                                            {userLocation
                                                ? "✅ Live location is being tracked"
                                                : "⏳ Waiting for user location…"}
                                        </div>

                                        {/* Legend */}
                                        <div className="legend" style={{ marginBottom: "10px" }}>
                                            <span>🟢 Start point</span>
                                            <span>📍 Current location</span>
                                            <span>🔵 Route path</span>
                                        </div>

                                        {/* Map */}
                                        <div className="map-wrapper">
                                            <MapContainer
                                                center={userLocation || [28.6139, 77.209]}
                                                zoom={13}
                                                style={{ height: "460px", width: "100%" }}
                                            >
                                                <MapUpdater position={userLocation} />
                                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                                                {route.length > 1 && (
                                                    <Polyline positions={route} pathOptions={{ color: "#3b82f6", weight: 3 }} />
                                                )}

                                                {startPoint && (
                                                    <Marker position={startPoint} icon={startIcon}>
                                                        <Popup><strong>🟢 Journey started here</strong></Popup>
                                                    </Marker>
                                                )}

                                                {userLocation && (
                                                    <Marker position={userLocation} icon={currentIcon}>
                                                        <Popup>
                                                            <strong>📍 Live User Location</strong><br />
                                                            Lat: {userLocation[0].toFixed(5)}<br />
                                                            Lng: {userLocation[1].toFixed(5)}<br />
                                                            Updated: {lastUpdated}
                                                        </Popup>
                                                    </Marker>
                                                )}
                                            </MapContainer>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

/* ── Hero (pre-join) styles ───────────────────────────────────── */
const heroStyles = {
    /* Two-column shell — fills the content area */
    shell: {
        display: "grid",
        gridTemplateColumns: "1fr 480px",
        gap: "32px",
        alignItems: "start",
        minHeight: "calc(100vh - 140px)",
    },

    /* ── LEFT ── */
    left: {
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        paddingTop: "8px",
    },

    /* Map illustration box */
    mapIllustration: {
        position: "relative",
        borderRadius: "16px",
        overflow: "hidden",
        background: "#0d1520",
        border: "1px solid var(--border-2)",
        height: "200px",
        boxShadow: "var(--shadow)",
    },
    mapGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gridTemplateRows: "repeat(5, 1fr)",
        height: "100%",
        width: "100%",
        opacity: 0.18,
    },
    mapCell: {
        borderRight: "1px solid #3b82f6",
        borderBottom: "1px solid #3b82f6",
    },
    routeSvg: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
    },
    pinOverlay: {
        position: "absolute",
        top: "14px",
        right: "58px",
        fontSize: "28px",
        lineHeight: 1,
        filter: "drop-shadow(0 2px 6px rgba(59,130,246,0.6))",
        animation: "pinBob 2s ease-in-out infinite",
    },

    heroTitle: {
        fontSize: "2rem",
        fontWeight: 700,
        color: "var(--text)",
        lineHeight: 1.25,
        margin: 0,
    },
    heroSub: {
        fontSize: "14px",
        color: "var(--text-muted)",
        lineHeight: 1.6,
        margin: 0,
        marginTop: "-14px",
    },

    /* Feature list */
    featureList: {
        listStyle: "none",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        margin: 0,
        padding: 0,
    },
    featureItem: {
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        background: "var(--surface-2)",
        border: "1px solid var(--border-2)",
        borderRadius: "12px",
        padding: "14px 16px",
    },
    featureIcon: {
        fontSize: "22px",
        lineHeight: 1,
        flexShrink: 0,
        marginTop: "1px",
    },
    featureLabel: {
        fontSize: "14px",
        fontWeight: 600,
        color: "var(--text)",
        marginBottom: "3px",
    },
    featureDesc: {
        fontSize: "12px",
        color: "var(--text-faint)",
        lineHeight: 1.45,
    },

    /* ── RIGHT ── */
    right: {
        background: "var(--surface-2)",
        border: "1px solid var(--border-2)",
        borderRadius: "18px",
        padding: "28px 26px",
        boxShadow: "var(--shadow-lg)",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        position: "sticky",
        top: "80px",
    },

    /* Welcome row */
    welcomeRow: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
    },
    avatar: {
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #2563eb, #7c3aed)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
        fontWeight: 700,
        color: "#fff",
        flexShrink: 0,
    },
    welcomeName: {
        fontSize: "16px",
        fontWeight: 600,
        color: "var(--text)",
        lineHeight: 1.2,
    },
    welcomeSub: {
        fontSize: "12px",
        color: "var(--text-faint)",
        marginTop: "2px",
    },

    /* Role card */
    roleCard: {
        background: "var(--surface)",
        border: "1px solid var(--border-2)",
        borderRadius: "12px",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
    },
    roleCardLeft: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flex: 1,
        minWidth: 0,
    },
    roleIconWrap: {
        width: "38px",
        height: "38px",
        borderRadius: "10px",
        background: "var(--surface-3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px",
        flexShrink: 0,
    },
    roleTitle: {
        fontSize: "13px",
        fontWeight: 600,
        color: "var(--text)",
        marginBottom: "2px",
    },
    roleDesc: {
        fontSize: "11px",
        color: "var(--text-faint)",
        lineHeight: 1.4,
    },

    /* Divider */
    divider: {
        height: "1px",
        background: "var(--border)",
        margin: "-4px 0",
    },

    /* Input with prefix icon */
    inputWrapper: {
        position: "relative",
    },
    inputIcon: {
        position: "absolute",
        left: "12px",
        top: "50%",
        transform: "translateY(-50%)",
        color: "var(--text-faint)",
        fontSize: "15px",
        fontWeight: 700,
        pointerEvents: "none",
        zIndex: 1,
    },

    /* Action buttons */
    actions: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        marginTop: "-4px",
    },
    joinBtn: {
        padding: "13px 20px",
        fontSize: "15px",
        gap: "8px",
        letterSpacing: "0.1px",
    },
    historyBtn: {
        padding: "11px 20px",
        fontSize: "14px",
        gap: "8px",
    },

    /* Stats strip */
    statsStrip: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1px",
        background: "var(--border)",
        borderRadius: "10px",
        overflow: "hidden",
        border: "1px solid var(--border)",
    },
    statItem: {
        background: "var(--surface)",
        padding: "10px 8px",
        textAlign: "center",
    },
    statVal: {
        fontSize: "13px",
        fontWeight: 700,
        color: "var(--accent)",
        lineHeight: 1.2,
    },
    statLabel: {
        fontSize: "11px",
        color: "var(--text-faint)",
        marginTop: "2px",
    },
};

const activeStyles = {
    statusBar: {
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        marginBottom: "20px",
    },
    statusItem: {
        flex: "1 1 160px",
        background: "var(--surface-2)",
        border: "1px solid var(--border-2)",
        borderRadius: "var(--radius)",
        padding: "14px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    statusLabel: {
        fontSize: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.6px",
        color: "var(--text-faint)",
        fontWeight: 600,
    },
};

export default LiveTracking;
