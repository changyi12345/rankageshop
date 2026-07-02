import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as authApi from "../api/auth";
import { normalizeUser } from "../utils/normalizeUser";

const AuthContext = createContext(null);

const LOGOUT_CONFIRM_MESSAGE = "Are you sure you want to log out?";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    setLoading(false);
  }, []);

  const logout = useCallback(
    ({ skipConfirm = false } = {}) => {
      if (!skipConfirm && !window.confirm(LOGOUT_CONFIRM_MESSAGE)) {
        return false;
      }
      clearSession();
      return true;
    },
    [clearSession],
  );

  const applySession = useCallback((data) => {
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.access_token);
    }
    if (data.user) {
      setUser(normalizeUser(data.user));
    }
    setLoading(false);
    return data.user;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .fetchMe()
      .then((me) => setUser(normalizeUser(me)))
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, [clearSession]);

  useEffect(() => {
    const onSessionInvalid = () => clearSession();
    window.addEventListener("auth:session-invalid", onSessionInvalid);
    return () => window.removeEventListener("auth:session-invalid", onSessionInvalid);
  }, [clearSession]);

  const login = useCallback(
    async (username, password) => {
      const data = await authApi.login({ username, password });
      applySession(data);
      return data;
    },
    [applySession]
  );

  const register = useCallback(
    async (payload) => {
      const data = await authApi.register(payload);
      applySession(data);
      return data;
    },
    [applySession]
  );

  const googleLogin = useCallback(
    async (idToken, referralCode) => {
      const data = await authApi.googleLogin({ idToken, referralCode });
      applySession(data);
      return data;
    },
    [applySession]
  );

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    try {
      const me = await authApi.fetchMe();
      setUser(normalizeUser(me));
      return me;
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
