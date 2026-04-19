import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";

const AuthContext = createContext(null);

const STORAGE_KEY = "loggedInUser";
const TOKEN_KEY = "token";

function getStoredValue(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
}

function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

export function AuthProvider({ children }) {
  //console.log("AuthProvider mounted");

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthed = !!user;

  const refreshMe = async () => {
    try {
      const token = getStoredValue(TOKEN_KEY);

      if (!token) {
        setUser(null);
        return;
      }

      const res = await apiClient.get("/api/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(res.data?.data || res.data);
    } catch (e) {
      console.error("refreshMe 실패:", e);
      clearStoredAuth();
      setUser(null);
    }
  };

  const login = async ({ email, password, keepLogin }) => {
    const res = await apiClient.post("/api/auth/login", { email, password });

    const token = res.data?.token || res.data?.accessToken || null;
    const storage = keepLogin ? localStorage : sessionStorage;

    clearStoredAuth();
    storage.setItem(STORAGE_KEY, email);

    if (token) {
      storage.setItem(TOKEN_KEY, token);
      await refreshMe();
    } else {
      // 토큰 없이 더미/임시 로그인 대응
      setUser({ email, nickname: email.split("@")[0] });
    }

    return res;
  };

  const dummyLogin = ({ email, keepLogin }) => {
    const storage = keepLogin ? localStorage : sessionStorage;

    clearStoredAuth();
    storage.setItem(STORAGE_KEY, email);

    setUser({
      email,
      nickname: email.split("@")[0],
    });
  };

  const logout = async () => {
    try {
      const token = getStoredValue(TOKEN_KEY);

      if (token) {
        await apiClient.post(
          "/api/auth/logout",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (e) {
      console.error("logout API 실패:", e);
    }

    clearStoredAuth();
    setUser(null);
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = getStoredValue(STORAGE_KEY);
      const storedToken = getStoredValue(TOKEN_KEY);

      if (!storedUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // 실제 로그인 토큰 있으면 /api/me 호출
      if (storedToken) {
        try {
          await refreshMe();
        } finally {
          setLoading(false);
        }
        return;
      }

      // 토큰 없으면 더미 로그인 상태로 간주
      setUser({
        email: storedUser,
        nickname: storedUser.split("@")[0],
      });
      setLoading(false);
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthed,
        loading,
        login,
        dummyLogin,
        logout,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}