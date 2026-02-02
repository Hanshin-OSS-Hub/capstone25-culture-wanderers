import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ children }) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth) {
    console.error("AuthProvider가 없습니다.");
    // 이미 /login이면 이동하지 않음
    if (location.pathname === "/login") return children;
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const { isAuthed, loading } = auth;

  if (loading) return null;

  if (!isAuthed) {
    //이미 /login이면 Navigate 하지 말고 그대로 렌더(루프 차단)
    if (location.pathname === "/login") return children;
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
