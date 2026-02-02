import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    console.log("✅ AuthProvider mounted");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthed = !!user;

  const refreshMe = async () => {
    try {
      // 백엔드 준비되면 GET /api/me로 연결
      const res = await apiClient.get("/api/me");
      setUser(res.data?.data || res.data); // 백엔드 포맷에 맞춰 조정
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password, keepLogin }) => {
    // 백엔드 준비되면 POST /api/auth/login로 연결
    const res = await apiClient.post("/api/auth/login", { email, password });

    // JWT면 여기서 accessToken 저장(백엔드 확정 후)
    // const token = res.data?.accessToken;
    // if (token) {
    //   const storage = keepLogin ? localStorage : sessionStorage;
    //   storage.setItem("accessToken", token);
    // }

    // 로그인 직후 내 정보 갱신
    // TODO: 백엔드 준비되면 /api/me 연결
    await refreshMe();
    return res;
  };

  const logout = async () => {
    try {
      await apiClient.post("/api/auth/logout");
    } catch (e) {
      // ignore
    }
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("accessToken");
    setUser(null);
  };

  useEffect(() => {
  //  테스트용 (백엔드 붙이면 지우기)
  setUser({ email: "test@nomad.com", nickname: "수리" });
  setLoading(false);

  //  백엔드 준비되면 아래로 복구
  // refreshMe();
  }, []);


  return (
    <AuthContext.Provider value={{ user, isAuthed, loading, login, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
