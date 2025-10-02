// src/lib/api.js
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // ← ya trae /api desde .env
  withCredentials: true,                 // ← manda/recibe la cookie
});

// (opcional) verifícalo una vez
console.info("[api] baseURL =", api.defaults.baseURL);

let isRefreshing = false;
let pendingQueue = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;
    const url = (original.url || "").toString();
    const msg = (error.response?.data?.message || "").toLowerCase();

    const isAuthEndpoint =
      url.includes("/refresh") || url.includes("/login") || url.includes("/register");

    const looksExpired = msg.includes("expired") || msg.includes("token has expired");

    // Solo intenta refresh si REALMENTE expiró un token existente
    if (status === 401 && !original.__isRetryRequest && !isAuthEndpoint && looksExpired) {
      if (isRefreshing) {
        await new Promise((resolve) => pendingQueue.push(resolve));
      } else {
        try {
          isRefreshing = true;
          await api.post("/refresh");
        } finally {
          isRefreshing = false;
          pendingQueue.forEach((fn) => fn());
          pendingQueue = [];
        }
      }
      original.__isRetryRequest = true;
      return api.request(original);
    }

    throw error;
  }
);
