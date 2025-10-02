import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "../../context/cart/cart-context";

// ===== Utils =====
function useLockBody(open) {
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = prev; };
  }, [open]);
}
const splitCSV = (v) =>
  (v ?? "")
    .toString()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const uniqCI = (arr) => {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = x.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  }
  return out;
};
function getSizeOptions(p) {
  if (Array.isArray(p?.sizes) && p.sizes.length) return uniqCI(p.sizes.map(String));
  if (Array.isArray(p?.size_options) && p.size_options.length) return uniqCI(p.size_options.map(String));
  if (typeof p?.size_options === "string") return uniqCI(splitCSV(p.size_options));
  if (typeof p?.size === "string") return uniqCI(splitCSV(p.size));
  if (p?.size != null) return uniqCI([String(p.size)]);
  return [];
}
function getColorOptions(p) {
  if (Array.isArray(p?.colors) && p.colors.length) return uniqCI(p.colors.map(String));
  if (Array.isArray(p?.color_options) && p.color_options.length) return uniqCI(p.color_options.map(String));
  if (typeof p?.color_options === "string") return uniqCI(splitCSV(p.color_options));
  if (typeof p?.color === "string") return uniqCI(splitCSV(p.color));
  if (p?.color != null) return uniqCI([String(p.color)]);
  return [];
}

function Placeholder({ text }) {
  const initials = (text || "P").toString().split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#e9dac8] to-[#d8c2aa]">
      <span className="text-4xl font-extrabold text-[#48331E] opacity-70">{initials}</span>
    </div>
  );
}

export default function ProductDetailModal({ open, onClose, product }) {
  const { addItem, formatCOP } = useCart();
  useLockBody(open);

  // ESC para cerrar
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const overlayRef = useRef(null);
  const onOverlayClick = (e) => { if (e.target === overlayRef.current) onClose?.(); };

  // Galería
  const images = useMemo(() => {
    const main = product?.main_image_url
      ? [{ url: product.main_image_url, alt: product.main_image_alt || product.name }]
      : [];
    const gal = Array.isArray(product?.images) ? product.images : [];
    return [...main, ...gal].filter((img, i, arr) => !img?.url || arr.findIndex((x) => x?.url === img?.url) === i);
  }, [product]);
  const [idx, setIdx] = useState(0);
  const goto = (i) => {
    if (!images.length) return;
    const n = ((i % images.length) + images.length) % images.length;
    setIdx(n);
  };
  const next = () => goto(idx + 1);
  const prev = () => goto(idx - 1);

  // Opciones (CSV/arrays)
  const sizeOptions = useMemo(() => getSizeOptions(product), [product]);
  const colorOptions = useMemo(() => getColorOptions(product), [product]);

  // Estado selección
  const [selSize, setSelSize] = useState("");
  const [selColor, setSelColor] = useState("");
  const [qty, setQty] = useState(1);
  useEffect(() => { if (!selSize && sizeOptions.length) setSelSize(sizeOptions[0]); }, [sizeOptions, selSize]);
  useEffect(() => { if (!selColor && colorOptions.length) setSelColor(colorOptions[0]); }, [colorOptions, selColor]);

  // Precio y formatos
  const price_cents = Number(product?.price_cents ?? 0);
  const money =
    formatCOP ??
    ((cents) =>
      new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(
        (cents || 0) / 100
      ));

  const handleAdd = () => {
    addItem({
      product_id: product?.id,
      name: product?.name || "Producto",
      image: images?.[idx]?.url || images?.[0]?.url || null,
      size: selSize || null,
      color: selColor || null,
      qty: Number(qty) || 1,
      price_cents,
      extra: { slug: product?.slug, category_id: product?.category_id, gender: product?.gender },
    });
    onClose?.();
  };

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onMouseDown={onOverlayClick}
      className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="product-modal-title"
    >
      <div
        className="w-full max-w-5xl bg-[#FAEAD7] rounded-2xl shadow-2xl border border-[#d8c2aa] overflow-hidden animate-[fadeIn_.15s_ease]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#d8c2aa] bg-[#faead738]">
          <h2 id="product-modal-title" className="text-xl font-extrabold text-[#191410]">
            {product?.name}
          </h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Galería */}
          <div className="p-4">
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-xl bg-[#e9dac8]">
              {images[idx]?.url ? (
                <img
                  key={images[idx].url}
                  src={images[idx].url}
                  alt={images[idx].alt || product?.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <Placeholder text={product?.name} />
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 btn btn-ghost"
                    aria-label="Anterior"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost"
                    aria-label="Siguiente"
                  >
                    →
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <button
                    key={img.url || i}
                    onClick={() => goto(i)}
                    className={`w-16 h-16 rounded-md overflow-hidden border ${i === idx ? "ring-brand" : ""}`}
                    aria-label={`Imagen ${i + 1}`}
                  >
                    {img?.url ? (
                      <img src={img.url} alt={img.alt || ""} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#d8c2aa]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info/Compra */}
          <div className="p-4 space-y-4">
            {/* Descripción */}
            <div className="text-sm text-[#48331E] whitespace-pre-line">
              {product?.description || "Sin descripción."}
            </div>

            {/* Chips */}
            <div className="flex flex-wrap gap-2">
              {product?.gender && (
                <span className="badge bg-[#e9dac8] text-[#48331E] border-[#d8c2aa] capitalize">
                  {product.gender === "male" ? "Hombre" : "Mujer"}
                </span>
              )}
              {product?.category?.name && (
                <span className="badge bg-[#e9dac8] text-[#48331E] border-[#d8c2aa]">
                  {product.category.name}
                </span>
              )}
              {product?.status !== "published" && (
                <span className="badge bg-[#48331E] text-[#FAEAD7] border-transparent capitalize">
                  {product.status}
                </span>
              )}
            </div>

            {/* Selectores */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Talla */}
              <div className="space-y-1">
                <div className="text-xs text-[#AC9484] font-semibold">Talla</div>
                {sizeOptions.length > 0 ? (
                  <select className="select" value={selSize} onChange={(e) => setSelSize(e.target.value)}>
                    {sizeOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-[#48331E]">—</div>
                )}
              </div>

              {/* Color */}
              <div className="space-y-1">
                <div className="text-xs text-[#AC9484] font-semibold">Color</div>
                {colorOptions.length > 0 ? (
                  <select className="select capitalize" value={selColor} onChange={(e) => setSelColor(e.target.value)}>
                    {colorOptions.map((c) => (
                      <option key={c} value={c} className="capitalize">
                        {c}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-[#48331E]">—</div>
                )}
              </div>

              {/* Cantidad */}
              <div className="space-y-1">
                <div className="text-xs text-[#AC9484] font-semibold">Cantidad</div>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  className="input"
                />
              </div>
            </div>

            {/* Resumen precios */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-sm">
              <div className="card p-2 text-center">
                <div className="text-[#AC9484] text-xs">Precio</div>
                <div className="font-semibold">{money(price_cents)}</div>
              </div>
              <div className="card p-2 text-center">
                <div className="text-[#AC9484] text-xs">Cantidad</div>
                <div className="font-semibold">{qty}</div>
              </div>
              <div className="card p-2 text-center">
                <div className="text-[#AC9484] text-xs">Total</div>
                <div className="font-semibold">{money((price_cents || 0) * qty)}</div>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-2 grid grid-cols-2 gap-2">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={handleAdd}>
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
