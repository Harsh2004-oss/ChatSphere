import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch currently logged-in user
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/api/user/profile");
        setAuthUser(res.data.user);
      } catch (err) {
        setAuthUser(null); // user not logged in
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // ✅ Login
  const login = async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    setAuthUser(res.data.user);
    return res.data.user;
  };

  // ✅ Register
  const register = async (username, email, password) => {
    const res = await api.post("/api/auth/register", { username, email, password });
    setAuthUser(res.data.user);
    return res.data.user;
  };

  // ✅ Logout
  const logout = async () => {
    await api.post("/api/auth/logout");
    setAuthUser(null);
  };

  return (
    <AuthContext.Provider value={{ authUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Custom hook to use auth
export const useAuth = () => useContext(AuthContext);
