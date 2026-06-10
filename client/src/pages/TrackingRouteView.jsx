import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { useAuth } from "../context/AuthContext";
import "../App.css";

/* ── Custom map icons ─────────────────────────────────────────── */
import L from "leaflet";

/* ── FitBounds: zooms the saved-route map to show the full path ──
   Runs once after the map mounts (positions never change on this
   page). maxZoom 19 ensures tight zoom for short/local routes.
─────────────────────────────────────────────────────────────────── */
function FitBounds({ positions }) {
    const map = useMap();
    useEffect(() => {
        if (!positions || positions.length === 0) return;
        if (positions.length === 1) {
            map.setView(positions[0], 19);
            return;
        }
        const bounds = L.latLngBounds(positions);
        map.fitBounds(bounds, {
            padding: [48, 48],
            maxZoom: 19,
            animate: false,   // instant on page load — no jarring fly-in
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);   // intentionally run only on mount
    return null;
}

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

const endIcon = L.divIcon({
    html: `<div style="
        width:14px;height:14px;
        background:#ef4444;
        border:2px solid white;
        border-radius:50%;
        box-shadow:0 0 6px rgba(0,0,0,0.6);
    "></div>`,
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
});

/* ── Format helpers ───────────────────────────────────────────── */
const fmt = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
};

const calcDuration = (start, end) => {
    if (!start || !end) return "—";
    const diff = Math.round((new Date(end) - new Date(start)) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

/* ── Component ────────────────────────────────────────────────── */
const TrackingRouteView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [session, setSession] = useState(null);

    useEffect(() => {
        fetch(`https://live-tracking-app-backend-umk2.onrender.com/api/tracking/history/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setSession(data));
    }, [id, token]);

    /* ── Loading state ──────────────────────────────────────────── */
    if (!session) {
        return (
            <div className="page">
                <nav className="navbar">
                    <div className="navbar-brand">
                        <div className="navbar-brand-icon">📍</div>
                        LiveTrack
                    </div>
                </nav>
                <div className="loading-screen" style={{ minHeight: "60vh" }}>
                    <div className="spinner" />
                    <span>Loading route data…</span>
                </div>
            </div>
        );
    }

    const positions = session.route.map((point) => [point.lat, point.lng]);
    const startPoint = positions[0];
    const endPoint   = positions[positions.length - 1];

    return (
        <div className="page">
            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-brand">
                    <div className="navbar-brand-icon">📍</div>
                    LiveTrack
                </div>
                <div className="navbar-right">
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate("/history")}
                        style={{ width: "auto" }}
                    >
                        ← Back to History
                    </button>
                </div>
            </nav>

            <div className="content">
                {/* Header */}
                <div style={{ marginBottom: "24px" }}>
                    <h1 style={{ fontSize: "1.8rem", marginBottom: "4px" }}>Saved Route</h1>
                    <p style={{ fontSize: "14px" }}>Replay the tracked journey below</p>
                </div>

                <div className="route-grid">
                    {/* ── Left – session details ───────────────────── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div className="card">
                            <p className="section-title">Session Details</p>

                            <div className="info-row">
                                <span>Tracking ID</span>
                                <strong>{session.trackingId}</strong>
                            </div>
                            <div className="info-row">
                                <span>User</span>
                                <strong>{session.userId?.name || "Unknown"}</strong>
                            </div>
                            <div className="info-row">
                                <span>Status</span>
                                <strong>
                                    <span className={`tag ${session.status === "completed" ? "completed" : ""}`}>
                                        {session.status || "saved"}
                                    </span>
                                </strong>
                            </div>
                            <div className="info-row">
                                <span>Route points</span>
                                <strong>{session.route.length}</strong>
                            </div>
                            <div className="info-row">
                                <span>Start time</span>
                                <strong>{fmt(session.startTime)}</strong>
                            </div>
                            <div className="info-row">
                                <span>End time</span>
                                <strong>{fmt(session.endTime)}</strong>
                            </div>
                            <div className="info-row">
                                <span>Duration</span>
                                <strong>{calcDuration(session.startTime, session.endTime)}</strong>
                            </div>
                        </div>

                        {/* Coordinates card */}
                        {positions.length > 0 && (
                            <div className="card">
                                <p className="section-title">Coordinates</p>
                                <div className="info-row">
                                    <span>🟢 Start lat</span>
                                    <strong>{startPoint[0].toFixed(5)}</strong>
                                </div>
                                <div className="info-row">
                                    <span>🟢 Start lng</span>
                                    <strong>{startPoint[1].toFixed(5)}</strong>
                                </div>
                                <div className="info-row">
                                    <span>🔴 End lat</span>
                                    <strong>{endPoint[0].toFixed(5)}</strong>
                                </div>
                                <div className="info-row">
                                    <span>🔴 End lng</span>
                                    <strong>{endPoint[1].toFixed(5)}</strong>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Right – map ──────────────────────────────── */}
                    <div>
                        {/* Legend */}
                        <div className="legend" style={{ marginBottom: "10px" }}>
                            <span>🟢 Start point</span>
                            <span>🔴 End point</span>
                            <span>🔵 Route path</span>
                        </div>

                        {positions.length > 0 ? (
                            <div className="map-wrapper">
                                <MapContainer
                                    center={startPoint}
                                    zoom={13}
                                    style={{ height: "520px", width: "100%" }}
                                >
                                    <FitBounds positions={positions} />
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                                    <Polyline
                                        positions={positions}
                                        pathOptions={{
                                            color: "#60a5fa",
                                            weight: 5,
                                            opacity: 1,
                                            lineJoin: "round",
                                            lineCap: "round",
                                        }}
                                    />

                                    <Marker position={startPoint} icon={startIcon}>
                                        <Popup><strong>🟢 Start Point</strong></Popup>
                                    </Marker>

                                    <Marker position={endPoint} icon={endIcon}>
                                        <Popup><strong>🔴 End Point</strong></Popup>
                                    </Marker>
                                </MapContainer>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">🗺️</div>
                                <h3>No route data</h3>
                                <p>This session has no recorded route points.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrackingRouteView;
