import { api } from "../../lib/api.js"; // Axios con baseURL = "http://localhost:8000/api"

// Normaliza y tipa valores antes de enviar
function normalizePayload(p = {}) {
  const name = (p.name ?? "").toString().trim();
  const slugRaw = (p.slug ?? "").toString().trim();
  return {
    name, // requerido por el backend
    slug: slugRaw || undefined, // NO enviar "" (rompe unique/nullable)
    subtitle: p.subtitle ?? "",
    description: p.description ?? "",
    color: p.color ?? "",
    position: Number.isFinite(Number(p.position)) ? Number(p.position) : 0,
    is_featured: p.is_featured ? 1 : 0, // boolean -> 1/0
    status: p.status ?? "published",
    image_alt: p.image_alt ?? "",
    image: p.image, // File | null | undefined
  };
}

// Construye FormData solo cuando hace falta (archivo o limpiar imagen)
const buildFormData = (payload = {}) => {
  const fd = new FormData();
  const data = normalizePayload(payload);

  // Campos simples (sin undefined)
  const keys = [
    "name",
    "slug",
    "subtitle",
    "description",
    "color",
    "position",
    "is_featured",
    "status",
    "image_alt",
  ];
  keys.forEach((k) => {
    const v = data[k];
    if (v !== undefined && v !== null) fd.append(k, typeof v === "number" ? String(v) : v);
  });

  // Archivo nuevo
  if (data.image instanceof File) {
    fd.append("image", data.image);
  }
  // Señal para limpiar imagen existente
  if (data.image === null) {
    fd.append("image", ""); // el controller detecta exists('image') sin hasFile
  }

  return fd;
};

export async function listCategories(params = {}) {
  const { data } = await api.get("/categories", {
    params,
    headers: { Accept: "application/json" },
  });
  return data;
}

export async function getCategory(id) {
  const { data } = await api.get(`/categories/${id}`, {
    headers: { Accept: "application/json" },
  });
  return data;
}

export async function createCategory(payload) {
  const norm = normalizePayload(payload);

  // Si hay archivo o quieres limpiar imagen => FormData
  if (norm.image instanceof File || norm.image === null) {
    const fd = buildFormData(norm);
    const { data } = await api.post("/categories", fd, {
      headers: { Accept: "application/json" }, // NO fijes Content-Type; deja el boundary
    });
    return data;
  }

  // Sin archivo => JSON
  const { data } = await api.post("/categories", norm, {
    headers: { Accept: "application/json" },
  });
  return data;
}

export async function updateCategory(id, payload) {
  const norm = normalizePayload(payload);

  // Con archivo o limpieza => FormData + _method=PUT
  if (norm.image instanceof File || norm.image === null) {
    const fd = buildFormData(norm);
    fd.append("_method", "PUT");
    const { data } = await api.post(`/categories/${id}`, fd, {
      headers: { Accept: "application/json" },
    });
    return data;
  }

  // Sin archivo => JSON PUT
  const { data } = await api.put(`/categories/${id}`, norm, {
    headers: { Accept: "application/json" },
  });
  return data;
}

export async function deleteCategory(id) {
  await api.delete(`/categories/${id}`, {
    headers: { Accept: "application/json" },
  });
  return true;
}

export async function toggleCategory(id) {
  const { data } = await api.patch(`/categories/${id}/toggle`, null, {
    headers: { Accept: "application/json" },
  });
  return data;
}
