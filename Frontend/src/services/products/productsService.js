// src/services/products/productsService.js
import { api } from "../../lib/api.js";

function normalize(p = {}) {
  const toInt = (x) =>
    Number.isFinite(Number(x)) ? parseInt(x, 10) : undefined;
  return {
    category_id: p.category_id,
    name: (p.name ?? "").toString().trim(),
    slug: (p.slug ?? "").toString().trim() || undefined,
    description: p.description ?? "",

    size: (p.size ?? "").toString(),
    color: (p.color ?? "").toString(),
    gender: p.gender ?? "male",

    status: p.status ?? "published",
    price_cents: toInt(p.price_cents ?? 0), // 👈 NUEVO

    main_image_alt: p.main_image_alt ?? "",
    main_image: p.main_image,
    images: Array.isArray(p.images) ? p.images : [],
    images_alt: Array.isArray(p.images_alt) ? p.images_alt : [],
    remove_image_ids: Array.isArray(p.remove_image_ids)
      ? p.remove_image_ids
      : [],
    images_order: Array.isArray(p.images_order) ? p.images_order : [],
  };
}

function buildFormData(p = {}) {
  const d = normalize(p);
  const fd = new FormData();

  const simple = [
    "category_id",
    "name",
    "slug",
    "description",
    "size",
    "color",
    "gender",
    "status",
    "price_cents", // 👈 NUEVO
    "main_image_alt",
  ];

  simple.forEach((k) => {
    const v = d[k];
    if (v !== undefined && v !== null && v !== "") {
      fd.append(k, String(v));
    }
  });

  if (d.main_image instanceof File) fd.append("main_image", d.main_image);
  if (d.main_image === null) fd.append("main_image", "");

  d.images.forEach((file) => {
    if (file instanceof File) fd.append("images[]", file);
  });
  d.images_alt.forEach((alt) => fd.append("images_alt[]", alt ?? ""));
  d.remove_image_ids.forEach((id) =>
    fd.append("remove_image_ids[]", String(id))
  );
  d.images_order.forEach((id) => fd.append("images_order[]", String(id)));

  return fd;
}

// ===== API =====

// Público (no necesita credenciales)
export async function listProducts(params = {}) {
  const { data } = await api.get("/products", {
    params,
    headers: { Accept: "application/json" },
  });
  return data;
}

export async function getProductBySlug(slug) {
  const { data } = await api.get(`/products/${encodeURIComponent(slug)}`, {
    headers: { Accept: "application/json" },
  });
  return data;
}

// Privado (requiere cookie JWT)
export async function createProduct(payload) {
  const fd = buildFormData(payload);
  const { data } = await api.post("/products", fd, {
    headers: { Accept: "application/json" },
    withCredentials: true, // <<< importante
  });
  return data;
}

export async function updateProduct(id, payload) {
  const fd = buildFormData(payload);
  fd.append("_method", "PUT");
  const { data } = await api.post(`/products/${id}`, fd, {
    headers: { Accept: "application/json" },
    withCredentials: true, // <<< importante
  });
  return data;
}

export async function deleteProduct(id) {
  await api.delete(`/products/${id}`, {
    headers: { Accept: "application/json" },
    withCredentials: true, // <<< importante
  });
  return true;
}
