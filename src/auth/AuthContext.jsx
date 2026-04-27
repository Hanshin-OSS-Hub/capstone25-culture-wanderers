import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";

const AuthContext = createContext(null);

const STORAGE_KEY = "loggedInUser";
const TOKEN_KEY = "token";
const NICKNAME_KEY = "nickname";

function getStoredValue(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
}

function getStorageByStoredUser() {
  if (localStorage.getItem(STORAGE_KEY)) return localStorage;
  if (sessionStorage.getItem(STORAGE_KEY)) return sessionStorage;
  return localStorage;
}

function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(NICKNAME_KEY);
  sessionStorage.removeItem(NICKNAME_KEY);
}

function storeNickname(nickname) {
  const safeNickname = String(nickname || "").trim();
  const storage = getStorageByStoredUser();

  localStorage.removeItem(NICKNAME_KEY);
  sessionStorage.removeItem(NICKNAME_KEY);

  if (safeNickname) {
    storage.setItem(NICKNAME_KEY, safeNickname);
  }
}

export function AuthProvider({ children }) {
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

      const nextUser = res.data?.data || res.data;
      setUser(nextUser);
      storeNickname(nextUser?.nickname || nextUser?.email?.split("@")[0] || "");
    } catch (error) {
      console.error("refreshMe 실패:", error);
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
      const fallbackNickname = email.split("@")[0];
      storeNickname(fallbackNickname);
      setUser({ email, nickname: fallbackNickname });
    }

    return res;
  };

  const dummyLogin = ({ email, keepLogin }) => {
    const storage = keepLogin ? localStorage : sessionStorage;

    clearStoredAuth();
    storage.setItem(STORAGE_KEY, email);
    storage.setItem(NICKNAME_KEY, email.split("@")[0]);

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
    } catch (error) {
      console.error("logout API 실패:", error);
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

      if (storedToken) {
        try {
          await refreshMe();
        } finally {
          setLoading(false);
        }
        return;
      }

      const fallbackNickname = getStoredValue(NICKNAME_KEY) || storedUser.split("@")[0];
      setUser({
        email: storedUser,
        nickname: fallbackNickname,
      });
      storeNickname(fallbackNickname);
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
