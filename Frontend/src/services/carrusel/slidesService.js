// Ajusta la ruta según tu proyecto:
import { api } from "../../lib/api.js"; // Debe ser una instancia de Axios con baseURL = "http://localhost:8000/api"

function toFormData(values = {}) {
  const fd = new FormData();
  const { title, alt, caption, is_active, image, mobile_image } = values;
  if (title) fd.append("title", title);
  if (alt) fd.append("alt", alt);
  if (caption) fd.append("caption", caption);
  if (typeof is_active === "boolean") fd.append("is_active", is_active ? "1" : "0");
  if (image) fd.append("image", image);
  if (mobile_image) fd.append("mobile_image", mobile_image);
  return fd;
}

function unwrap(data) {
  // Soporta Resource::collection / Resource
  return Array.isArray(data) ? data : (data?.data ?? data);
}

/* ------------ CRUD ------------ */
export async function listSlides({ page = 1, search = "", active } = {}) {
  const params = { page };
  if (search) params.search = search;
  if (active !== undefined && active !== null) params.active = !!active;
  const { data } = await api.get("/admin/slides", { params });
  return {
    data: unwrap(data),
    meta: data?.meta ?? null,
  };
}

export async function createSlide(values) {
  const fd = toFormData(values);
  const { data } = await api.post("/admin/slides", fd);
  return unwrap(data);
}

export async function updateSlide(id, values) {
  const fd = toFormData(values);
  const { data } = await api.patch(`/admin/slides/${id}`, fd);
  return unwrap(data);
}

export async function deleteSlide(id) {
  await api.delete(`/admin/slides/${id}`);
  return true;
}

export async function toggleSlide(id) {
  const { data } = await api.patch(`/admin/slides/${id}/toggle`);
  return unwrap(data);
}

export async function listPublicSlides() {
  // Devuelve solo activos y vigentes (según tu controlador)
  const { data } = await api.get("/slides");
  // data puede venir envolvido en { data: [...] } por el Resource::collection
  const items = Array.isArray(data) ? data : (data?.data ?? []);
  return items;
}