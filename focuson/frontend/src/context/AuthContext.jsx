/**
 * AuthContext.js
 * Manages authentication state, JWT tokens, and user session.
 * Access token stored in memory (XSS-safe).
 * Refresh token stored in httpOnly cookie (set by backend).
 */

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Checking if session exists

  // On mount: try to restore session via refresh token
  useEffect(() => {
    const restore = async () => {
      try {
        const res = await api.post("/auth/refresh");
        api.defaults.headers.common["Authorization"] = `Bearer ${res.data.access_token}`;
        setUser(res.data.user);
      } catch {
        // No valid session – user needs to log in
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { access_token, user: userData } = res.data;
    // Store token in memory (not localStorage — XSS protection)
    api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (name, email, password, passwordConfirmation) => {
    const res = await api.post("/auth/register", {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
    const { access_token, user: userData } = res.data;
    api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
