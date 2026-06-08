import { useState } from "react";
import { loginUser } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
const Login = () => {
    const [error, setError] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = await loginUser(formData);

        if (data.token) {
            login(data.user, data.token);
            navigate("/tracking");
        } else {
            setError(data.message || "Login failed");
        }
    };

    return (

        <div style={styles.page}>
            <div style={styles.card}>
                <h2 style={styles.title}>Login</h2>
                <p style={styles.subtitle}>Access your live tracking dashboard</p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <input
                        style={styles.input}
                        type="email"
                        name="email"
                        placeholder="Enter email"
                        value={formData.email}
                        onChange={handleChange}
                    />

                    <input
                        style={styles.input}
                        type="password"
                        name="password"
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={handleChange}
                    />
                    {error && <p style={styles.error}>{error}</p>}
                    <button style={styles.button} type="submit">
                        Login
                    </button>

                    <p style={styles.text}>
                        Don't have an account?{" "}
                        <Link to="/register" style={styles.link}>
                            Register
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};
const styles = {
    page: {
        minHeight: "100vh",
        background: "#111827",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
    },
    card: {
        width: "380px",
        background: "#1f2937",
        padding: "30px",
        borderRadius: "16px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        color: "white",
    },
    title: {
        textAlign: "center",
        marginBottom: "8px",
        fontSize: "2rem",
    },
    subtitle: {
        textAlign: "center",
        color: "#9ca3af",
        marginBottom: "25px",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "14px",
    },
    input: {
        padding: "12px",
        borderRadius: "8px",
        border: "1px solid #374151",
        background: "#111827",
        color: "white",
        fontSize: "15px",
    },
    button: {
        padding: "12px",
        borderRadius: "8px",
        border: "none",
        background: "#2563eb",
        color: "white",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: "pointer",
    },
    text: {
        textAlign: "center",
        marginTop: "10px",
        color: "#9ca3af",
    },

    link: {
        color: "#60a5fa",
        textDecoration: "none",
        fontWeight: "bold",
    },
    error: {
        color: "#f87171",
        textAlign: "center",
        margin: "0",
    },
};

export default Login;