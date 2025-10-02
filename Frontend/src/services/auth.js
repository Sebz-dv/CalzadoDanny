import { api } from "../lib/api";

export async function register(payload) {
  const { data } = await api.post("/register", payload);
  return data.user;
}

export async function login(payload) {
  const { data } = await api.post("/login", payload);
  return data.user;
}

export async function me() {
  const { data } = await api.get("/me");
  return data;
}

export async function logout() {
  await api.post("/logout");
}
// src/services/auth.js
export async function meQuiet() {
  try {
    const { data } = await api.get("/me");
    return data;
  } catch (err) {
    if (err?.response?.status === 401) return null; // sin sesión
    throw err;
  }
}
