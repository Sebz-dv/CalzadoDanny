// src/lib/api.js
import axios from "axios";

const ORIGIN = import.meta.env.VITE_API_ORIGIN || "";
const API_PATH = import.meta.env.VITE_API_BASE_URL || "/api";
const USE_CREDENTIALS = import.meta.env.VITE_USE_CREDENTIALS === "true";

export const api = axios.create({
  baseURL: `${ORIGIN}${API_PATH}`, // ej: https://backend.calzadodanny.com/api
  withCredentials: USE_CREDENTIALS, // manda/recibe la cookie
});

// (opcional) verifícalo una vez
// console.info("[api] baseURL =", api.defaults.baseURL);

let isRefreshing = false;
// si quieres que VSCode entienda el tipo, puedes usar JSDoc:
 /** @type {Array<() => void>} */
let pendingQueue = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;
    const url = (original.url || "").toString();
    const msg = (error.response?.data?.message || "").toLowerCase();

    const isAuthEndpoint =
      url.includes("/refresh") ||
      url.includes("/login") ||
      url.includes("/register");

    const looksExpired =
      msg.includes("expired") || msg.includes("token has expired");

    // Solo intenta refresh si REALMENTE expiró un token existente
    if (
      status === 401 &&
      !original.__isRetryRequest &&
      !isAuthEndpoint &&
      looksExpired
    ) {
      if (isRefreshing) {
        await new Promise((resolve) => {
          pendingQueue.push(resolve);
        });
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

    // en interceptors es mejor devolver el reject explícito
    return Promise.reject(error);
  }
);
