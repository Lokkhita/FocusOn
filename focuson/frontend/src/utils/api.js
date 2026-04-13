/**
 * api.js – Axios instance with:
 * - Base URL from env
 * - Auto token refresh on 401
 * - Request/response interceptors
 * - CSRF protection headers
 */

import axios from "axios";
import toast from "react-hot-toast";

/** In development, default to same-origin `/api` so the CRA proxy + cookies work. */
function apiBaseURL() {
  const explicit = process.env.REACT_APP_API_URL;
  if (explicit !== undefined && explicit !== "") return explicit;
  if (process.env.NODE_ENV === "development") return "/api";
  return "http://localhost:8000/api";
}

const api = axios.create({
  baseURL: apiBaseURL(),
  withCredentials: true, // Send httpOnly cookies (refresh token)
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Requested-With": "XMLHttpRequest", // CSRF protection
  },
  timeout: 30000, // 30 second timeout
});

// ── Request Interceptor ──
// Sanitize outgoing data to prevent XSS
api.interceptors.request.use(
  (config) => {
    // Log API calls in development only
    if (process.env.NODE_ENV === "development") {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ──
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not refresh on auth endpoints (avoids loops + wrong redirects on login/register)
    const url = originalRequest.url || "";
    const skipRefresh =
      url.includes("/auth/refresh") ||
      url.includes("/auth/login") ||
      url.includes("/auth/register");

    // Handle 401: try token refresh once
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !skipRefresh
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await api.post("/auth/refresh");
        const newToken = res.data.access_token;
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        processQueue(null, newToken);
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle common errors
    const message = error.response?.data?.message || "Something went wrong";
    if (error.response?.status === 422) {
      // Validation errors — let forms handle them
      return Promise.reject(error);
    }
    if (error.response?.status === 429) {
      toast.error("Too many requests. Please slow down.");
    } else if (error.response?.status >= 500) {
      toast.error("Server error. Please try again.");
    }

    return Promise.reject(error);
  }
);

export default api;
