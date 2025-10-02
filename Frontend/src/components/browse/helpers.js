// src/components/browse/helpers.js
export const cx = (...a) => a.filter(Boolean).join(" ");
export const norm = (s) => (s || "").toString().trim().toLowerCase();
export const splitCSV = (v) =>
  (v ?? "")
    .toString()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const uniqCI = (arr) => {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = x.toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(x); }
  }
  return out;
};

export const toggleSet = (setter) => (value) => {
  setter((prev) => {
    const n = new Set(prev);
    n.has(value) ? n.delete(value) : n.add(value);
    return n;
  });
};

// Normalizadores de tallas/colores (idénticos a los tuyos)
export const sizesOf = (p) => {
  if (Array.isArray(p?.sizes) && p.sizes.length) return p.sizes.map(String);
  if (Array.isArray(p?.size_options) && p.size_options.length) return p.size_options.map(String);
  if (typeof p?.size_options === "string") return splitCSV(p.size_options);
  if (typeof p?.size === "string") return splitCSV(p.size);
  if (p?.size != null) return [String(p.size)];
  return [];
};
export const colorsOf = (p) => {
  if (Array.isArray(p?.colors) && p.colors.length) return p.colors.map(String);
  if (Array.isArray(p?.color_options) && p.color_options.length) return p.color_options.map(String);
  if (typeof p?.color_options === "string") return splitCSV(p.color_options);
  if (typeof p?.color === "string") return splitCSV(p.color);
  if (p?.color != null) return [String(p.color)];
  return [];
};
