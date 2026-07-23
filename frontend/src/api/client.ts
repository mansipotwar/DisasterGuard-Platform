import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:5000",
});

// Attach JWT token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


// =========================
// 🔥 AUTH APIs
// =========================

export const loginUser = (email: string, password: string) =>
  API.post("/auth/login", { email, password });

export const registerUser = (data: any) =>
  API.post("/auth/register", data);


// =========================
// 🔥 DASHBOARD API
// =========================

export const getDashboardSummary = () =>
  API.get("/dashboard/summary");


// =========================
// 🔥 PREDICTION API (FIX)
// =========================

export const predictDisaster = (data: {
  lat: number;
  lon: number;
}) =>
  API.post("/predict", data);


export default API;