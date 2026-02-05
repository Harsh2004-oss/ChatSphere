import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/user/profile")
      .then(res => setAuthUser(res.data.user))
      .catch(() => setAuthUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    setAuthUser(res.data.user);
  };

  const register = async (username, email, password) => {
    const res = await api.post("/api/auth/register", {
      username,
      email,
      password
    });
    setAuthUser(res.data.user);
  };

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

export const useAuth = () => useContext(AuthContext);
