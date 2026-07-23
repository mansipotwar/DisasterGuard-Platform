import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardSummary } from "../api/client";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await getDashboardSummary();
      setData(res.data.dashboard);
    } catch (err) {
      console.error(err);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchDashboard();
    else setLoading(false);
  }, [token]);

  // 🔒 Guest view
  if (!token) {
    return (
      <div style={styles.center}>
        <h1>🔒 Personalized Dashboard</h1>
        <p>Login to view your disaster insights</p>
        <div style={{ marginTop: "20px" }}>
          <button onClick={() => navigate("/login")} style={styles.primaryBtn}>
            Login
          </button>
          <button onClick={() => navigate("/signup")} style={styles.secondaryBtn}>
            Sign Up
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <h2 style={{ textAlign: "center" }}>Loading...</h2>;

  const today = new Date().toLocaleDateString();

  const getColor = (risk: string) => {
    if (risk === "HIGH") return "#ef4444";
    if (risk === "Medium") return "#f59e0b";
    return "#22c55e";
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={{ margin: 0 }}>🚀 Dashboard</h1>
          <p style={{ margin: 0, color: "#64748b" }}>
            {user?.name || user?.email} • {today}
          </p>
        </div>

        <button onClick={logout} style={styles.logout}>
          Logout
        </button>
      </div>

      {/* LOCATION */}
      <div style={styles.locationCard}>
        📍 Location: {data?.location?.name || "Saved Location"}
      </div>

      {/* PREDICTIONS */}
      <h2 style={{ marginTop: "30px" }}>🔥 Risk Overview</h2>

      <div style={styles.grid}>
        {Object.entries(data?.latest || {}).map(([key, val]: any) => (
          <div key={key} style={styles.card}>
            <h3 style={{ marginBottom: "10px" }}>{key.toUpperCase()}</h3>

            <p>
              Risk:{" "}
              <span style={{ color: getColor(val.risk_level), fontWeight: 600 }}>
                {val.risk_level}
              </span>
            </p>

            <p>Probability: {val.probability_percent}%</p>
            <p>Confidence: {val.confidence_percent}%</p>
          </div>
        ))}
      </div>

      {/* RECENT */}
      <h2 style={{ marginTop: "40px" }}>📊 Last 24 Hours</h2>

      <div style={styles.grid}>
        {data?.recent_24h?.slice(0, 6).map((item: any) => (
          <div key={item.id} style={styles.smallCard}>
            <b>{item.disaster_type}</b>
            <p style={{ color: getColor(item.risk_level) }}>
              {item.risk_level}
            </p>
            <p>{item.probability_percent}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles: any = {
  container: {
    padding: "100px 2rem 2rem",
    maxWidth: "1100px",
    margin: "auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logout: {
    padding: "8px 14px",
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },

  locationCard: {
    marginTop: "20px",
    padding: "12px",
    background: "#f1f5f9",
    borderRadius: "8px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginTop: "15px",
  },

  card: {
    padding: "16px",
    borderRadius: "10px",
    background: "#ffffff",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },

  smallCard: {
    padding: "12px",
    borderRadius: "8px",
    background: "#f8fafc",
    textAlign: "center",
  },

  center: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },

  primaryBtn: {
    padding: "10px 16px",
    marginRight: "10px",
    background: "#0ea5e9",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },

  secondaryBtn: {
    padding: "10px 16px",
    background: "#e2e8f0",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};