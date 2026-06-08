import { useState } from "react";
import { registerUser } from "../api/authApi";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "user",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = await registerUser(formData);

        if (data.user) {
            navigate("/login");
        } else {
            setError(data.message || "Register failed");
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <h2 style={styles.title}>Register</h2>
                <p style={styles.subtitle}>Create your live tracking account</p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <input
                        style={styles.input}
                        type="text"
                        name="name"
                        placeholder="Enter name"
                        value={formData.name}
                        onChange={handleChange}
                    />

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

                    <select
                        style={styles.input}
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                    >
                        <option value="user">User</option>
                        <option value="vendor">Vendor</option>
                    </select>
                    {error && <p style={styles.error}>{error}</p>}
                    <button style={styles.button} type="submit">
                        Register
                    </button>
                    <p style={styles.text}>
                        Already have an account?{" "}
                        <Link to="/login" style={styles.link}>
                            Login
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
    },
    card: {
        width: "380px",
        background: "#1f2937",
        padding: "30px",
        borderRadius: "16px",
        color: "white",
    },
    title: {
        textAlign: "center",
    },
    subtitle: {
        textAlign: "center",
        color: "#9ca3af",
        marginBottom: "20px",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    input: {
        padding: "12px",
        borderRadius: "8px",
        border: "1px solid #374151",
        background: "#111827",
        color: "white",
    },
    button: {
        padding: "12px",
        borderRadius: "8px",
        border: "none",
        background: "#2563eb",
        color: "white",
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

export default Register;