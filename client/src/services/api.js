import axios from "axios";
import { getStoredToken } from "@/context/AuthContext";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || "Request failed";
    if (error.response?.status === 401 && !error.config?.url?.includes("/auth/login")) {
      localStorage.removeItem("quantacus_token");
      localStorage.removeItem("quantacus_user");
      const path = window.location.pathname;
      if (path !== "/" && path !== "/register") {
        window.location.assign("/");
      }
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
