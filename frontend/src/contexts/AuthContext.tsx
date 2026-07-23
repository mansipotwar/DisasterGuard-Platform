import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import API from "../api/client";

interface AuthContextType {
  user: any;
  token: string | null;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [user, setUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState<boolean>(
    sessionStorage.getItem("isGuest") === "true"
  );

  // ✅ AUTO FETCH USER IF TOKEN EXISTS
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;

      try {
        const res = await API.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(res.data.user);
      } catch (err) {
        console.error("Auth restore failed:", err);
        logout();
      }
    };

    fetchUser();
  }, [token]);

  // ✅ LOGIN
  const login = async (email: string, password: string) => {
    try {
      const res = await API.post("/auth/login", { email, password });

      const token = res.data.token;

      localStorage.setItem("token", token);
      setToken(token);
      setIsGuest(false);

      // ✅ FETCH USER WITH TOKEN
      const me = await API.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(me.data.user);

      return true;
    } catch (err) {
      console.error("Login error:", err);
      return false;
    }
  };

  // ✅ REGISTER
  const register = async (data: any) => {
    try {
      const res = await API.post("/auth/register", data);

      const token = res.data.token;

      localStorage.setItem("token", token);
      setToken(token);
      setIsGuest(false);

      setUser(res.data.user);

      return true;
    } catch (err) {
      console.error("Register error:", err);
      return false;
    }
  };

  // ✅ LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("isGuest");
    setToken(null);
    setUser(null);
    setIsGuest(false);
  };

  // ✅ GUEST MODE
  const continueAsGuest = () => {
    setIsGuest(true);
    sessionStorage.setItem("isGuest", "true");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isGuest,
        login,
        register,
        logout,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}