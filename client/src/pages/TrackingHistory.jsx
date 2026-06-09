import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../App.css";

const TrackingHistory = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);   // tracks which card is mid-delete
    const [toast, setToast] = useState(null);              // { type: "success"|"error", msg }

    useEffect(() => {
        fetch("http://live-tracking-app-backend-umk2.onrender.com/api/tracking/history", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setSessions(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [token]);

    /* ── Toast helper ───────────────────────────────────────────── */
    const showToast = useCallback((type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    }, []);

    /* ── Delete handler ─────────────────────────────────────────── */
    const handleDelete = async (session) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete this tracking session?\n\nTracking ID: ${session.trackingId}`
        );
        if (!confirmed) return;

        setDeletingId(session._id);

        try {
            const res = await fetch(
                `http://live-tracking-app-backend-umk2.onrender.com/api/tracking/history/${session._id}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (res.ok) {
                // Remove card immediately — no page refresh
                setSessions((prev) => prev.filter((s) => s._id !== session._id));
                showToast("success", `Session "${session.trackingId}" deleted successfully.`);
            } else {
                const data = await res.json().catch(() => ({}));
                showToast("error", data.message || "Failed to delete session. Please try again.");
            }
        } catch {
            showToast("error", "Network error. Could not delete session.");
        } finally {
            setDeletingId(null);
        }
    };

    /* ── Format date helper ─────────────────────────────────────── */
    const fmt = (iso) => {
        if (!iso) return "—";
        return new Date(iso).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    return (
        <div className="page">
            {/* ── Toast notification ──────────────────────────────── */}
            {toast && (
                <div style={{
                    ...toastStyles.base,
                    ...(toast.type === "success" ? toastStyles.success : toastStyles.error),
                }}>
                    <span>{toast.type === "success" ? "✅" : "❌"}</span>
                    <span>{toast.msg}</span>
                    <button
                        onClick={() => setToast(null)}
                        style={toastStyles.close}
                        aria-label="Dismiss"
                    >
                        ✕
                    </button>
                </div>
            )}
            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-brand">
                    <div className="navbar-brand-icon">📍</div>
                    LiveTrack
                </div>
                <div className="navbar-right">
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate("/tracking")}
                        style={{ width: "auto" }}
                    >
                        ← Dashboard
                    </button>
                </div>
            </nav>

            <div className="content">
                {/* Header */}
                <div style={{ marginBottom: "24px" }}>
                    <h1 style={{ fontSize: "1.8rem", marginBottom: "4px" }}>Tracking History</h1>
                    <p style={{ fontSize: "14px" }}>
                        {loading ? "Loading sessions…" : `${sessions.length} saved session${sessions.length !== 1 ? "s" : ""}`}
                    </p>
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="loading-screen" style={{ minHeight: "40vh" }}>
                        <div className="spinner" />
                        <span>Fetching tracking history…</span>
                    </div>
                )}

                {/* Empty state */}
                {!loading && sessions.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon">🗺️</div>
                        <h3>No sessions found</h3>
                        <p>Start a tracking session and save it to see history here.</p>
                        <button
                            className="btn btn-primary"
                            style={{ width: "auto", marginTop: "8px" }}
                            onClick={() => navigate("/tracking")}
                        >
                            Go to Dashboard
                        </button>
                    </div>
                )}

                {/* Session cards */}
                {!loading && sessions.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {sessions.map((session) => (
                            <div key={session._id} className="history-card">
                                {/* Left – meta */}
                                <div className="history-card-meta">
                                    <div className="history-card-id">
                                        🔖 {session.trackingId}
                                    </div>

                                    <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
                                        User: <strong style={{ color: "var(--text)" }}>{session.userId?.name || "Unknown"}</strong>
                                    </div>

                                    <div className="history-card-tags">
                                        <span className={`tag ${session.status === "completed" ? "completed" : ""}`}>
                                            {session.status || "saved"}
                                        </span>
                                        <span className="tag blue">
                                            {session.route?.length ?? 0} points
                                        </span>
                                        {session.startTime && (
                                            <span className="tag">
                                                {fmt(session.startTime)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Right – actions */}
                                <div style={cardStyles.actions}>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        style={cardStyles.viewBtn}
                                        onClick={() => navigate(`/history/${session._id}`)}
                                    >
                                        View Route →
                                    </button>
                                    <button
                                        className="btn btn-sm"
                                        style={cardStyles.deleteBtn}
                                        onClick={() => handleDelete(session)}
                                        disabled={deletingId === session._id}
                                        aria-label={`Delete session ${session.trackingId}`}
                                    >
                                        {deletingId === session._id ? "Deleting…" : "🗑 Delete"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

/* ── Toast styles ─────────────────────────────────────────────── */
const toastStyles = {
    base: {
        position: "fixed",
        bottom: "28px",
        right: "28px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "14px 18px",
        borderRadius: "12px",
        fontSize: "14px",
        fontWeight: 500,
        maxWidth: "400px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
        animation: "slideInToast 0.25s ease",
    },
    success: {
        background: "#064e3b",
        border: "1px solid #065f46",
        color: "#6ee7b7",
    },
    error: {
        background: "#450a0a",
        border: "1px solid #7f1d1d",
        color: "#fca5a5",
    },
    close: {
        marginLeft: "auto",
        background: "transparent",
        border: "none",
        color: "inherit",
        fontSize: "14px",
        cursor: "pointer",
        opacity: 0.7,
        padding: "0 2px",
        width: "auto",
    },
};

/* ── Card action button styles ────────────────────────────────── */
const cardStyles = {
    actions: {
        display: "flex",
        gap: "8px",
        flexShrink: 0,
        alignItems: "stretch",
    },
    viewBtn: {
        width: "auto",
        whiteSpace: "nowrap",
    },
    deleteBtn: {
        width: "auto",
        whiteSpace: "nowrap",
        background: "#991b1b",
        color: "#fff",
        border: "1px solid #7f1d1d",
        transition: "background 0.15s",
    },
};

export default TrackingHistory;
