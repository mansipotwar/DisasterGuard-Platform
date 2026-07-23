import { AlertCircle, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    lat: "",
    lon: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.password || !form.lat || !form.lon) {
      setError("All fields are required");
      return;
    }

    setLoading(true);

    const success = await register({
      name: form.name,
      email: form.email,
      password: form.password,
      location: {
        lat: Number(form.lat),
        lon: Number(form.lon),
      },
    });

    setLoading(false);

    if (!success) {
      setError("Signup failed. Try different email.");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0a0f1e",
      padding: "1.5rem"
    }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>

        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: "3rem",
            height: "3rem",
            background: "linear-gradient(135deg, #0d9488, #0891b2)",
            borderRadius: "0.875rem",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem"
          }}>
            <ShieldAlert size={20} color="white" />
          </div>

          <h1 style={{ color: "#e2e8f0", fontWeight: 800 }}>
            Create Account
          </h1>
        </div>

        {/* CARD */}
        <div className="glass-card" style={{ padding: "1.75rem" }}>

          {/* ERROR */}
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "1rem",
              color: "#f87171",
              fontSize: "0.85rem"
            }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            <input
              className="input-field"
              placeholder="Full Name"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              className="input-field"
              placeholder="Email"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <input
              type="password"
              className="input-field"
              placeholder="Password"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <input
              className="input-field"
              placeholder="Latitude (e.g. 21.1458)"
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
            />

            <input
              className="input-field"
              placeholder="Longitude (e.g. 79.0882)"
              onChange={(e) => setForm({ ...form, lon: e.target.value })}
            />

            <button className="btn-primary" disabled={loading}>
              {loading ? "Creating..." : "Sign Up"}
            </button>
          </form>

          <p style={{
            textAlign: "center",
            marginTop: "1rem",
            color: "#94a3b8"
          }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#14b8a6" }}>
              Login
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}