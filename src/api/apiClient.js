import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  // 쿠키/세션 방식이면 true로 바꾸면 됨
  withCredentials: false,
});

// JWT 방식이면 아래 주석 해제해서 사용(백엔드 확정 후)
// apiClient.interceptors.request.use((config) => {
//   const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });
