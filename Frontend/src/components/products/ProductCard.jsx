// src/components/product/ProductCard.jsx
import React, { useMemo, useState } from "react";
import ProductDetailModal from "./ProductDetailModal";
import { useCart } from "../../context/cart/cart-context";

function Placeholder({ text }) {
  const initials = (text || "P")
    .toString()
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#e9dac8] to-[#d8c2aa]">
      <span className="text-4xl font-extrabold text-[#48331E] opacity-70">
        {initials}
      </span>
    </div>
  );
}

/* ==== Utils CSV/arrays -> opciones únicas ==== */
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

/** ===== Precio robusto (detecta COP o centavos) =====
 * Prioriza: price_cop (número) -> price_cents (centavos) -> price (número)
 * Devuelve siempre { displayCop, cents, source }
 */
function pickPrice(product) {
  const rawCop = product?.price_cop;
  const rawCts = product?.price_cents;
  const rawAny = product?.price;

  // price_cop válido (descarta objetos vacíos u otros tipos)
  if (typeof rawCop === "number" && Number.isFinite(rawCop)) {
    // Si el backend ya manda COP, mostramos tal cual y convertimos a cents para carrito
    return { displayCop: rawCop, cents: Math.round(rawCop * 100), source: "price_cop" };
  }

  // price_cents (legacy) válido
  if (typeof rawCts === "number" && Number.isFinite(rawCts)) {
    return { displayCop: rawCts / 100, cents: rawCts, source: "price_cents" };
  }

  // price (genérico) válido (asumimos COP)
  if (typeof rawAny === "number" && Number.isFinite(rawAny)) {
    return { displayCop: rawAny, cents: Math.round(rawAny * 100), source: "price" };
  }

  // Nada válido => 0
  return { displayCop: 0, cents: 0, source: "none" };
}

export default function ProductCard({ product }) {
  const [open, setOpen] = useState(false);
  const { addItem, notifyAdded, formatCOP } = useCart();

  // Imagen de portada
  const cover = useMemo(() => {
    const main = product?.main_image_url
      ? { url: product.main_image_url, alt: product.main_image_alt || product?.name }
      : null;
    const firstGallery = Array.isArray(product?.images) ? product.images[0] : null;
    return main?.url ? main : firstGallery?.url ? firstGallery : null;
  }, [product]);

  // Opciones (soportan CSV)
  const sizeOptions  = useMemo(() => getSizeOptions(product),  [product]);
  const colorOptions = useMemo(() => getColorOptions(product), [product]);

  // Precio (siempre consistente)
  const { displayCop, cents, } = useMemo(() => pickPrice(product), [product]);
  const priceFmt =
    typeof formatCOP === "function"
      ? formatCOP(cents) // nuestro helper del contexto suele recibir CENTAVOS
      : new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(displayCop);

  // Log para ver qué se tomó
  // useEffect(() => {
  //   if (!product) return;
  //   console.log("[ProductCard] Precio detectado", {
  //     id: product.id,
  //     name: product.name,
  //     price_cop: product.price_cop,
  //     price_cents_legacy: product.price_cents,
  //     price_raw: product.price,
  //     elegido_de: source,
  //     displayCop,
  //     cents,
  //     formateado: priceFmt,
  //   });
  // }, [product, displayCop, cents, priceFmt, source]);

  // Agregado rápido
  const quickAdd = () => {
    const size  = sizeOptions[0]  ?? null;
    const color = colorOptions[0] ?? null;

    const item = {
      product_id: product?.id,
      name: product?.name || "Producto",
      image: cover?.url || null,
      size,
      color,
      qty: 1,
      price_cents: cents, // 💡 SIEMPRE en centavos dentro del carrito
      extra: {
        slug: product?.slug,
        category_id: product?.category_id,
        gender: product?.gender,
      },
    };

    addItem(item);
    notifyAdded({ name: item.name, size: item.size, color: item.color, qty: item.qty });
  };

  return (
    <>
      <div className="bg-[#faead738] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#e9dac8]">
          {cover?.url ? (
            <img
              src={cover.url}
              alt={cover.alt || product?.name}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              loading="lazy"
            />
          ) : (
            <Placeholder text={product?.name} />
          )}

          {product?.status !== "published" && (
            <span className="absolute top-3 left-3 px-3 py-1 text-xs font-bold rounded-full bg-[#48331E] text-[#FAEAD7] capitalize">
              {product.status}
            </span>
          )}
        </div>

        <div className="p-4 space-y-2">
          <h3 className="font-extrabold text-xl text-[#191410] line-clamp-1">
            {product?.name}
          </h3>

          {product?.description ? (
            <p className="text-sm text-[#48331E] line-clamp-2">{product.description}</p>
          ) : null}

          <div className="flex items-center justify-between pt-1">
            <div className="flex flex-wrap gap-2">
              {product?.gender && (
                <span className="badge bg-[#e9dac8] text-[#48331E] border-[#d8c2aa] capitalize">
                  {product.gender === "male" ? "Hombre" : "Mujer"}
                </span>
              )}
              {sizeOptions[0] && (
                <span className="badge bg-[#e9dac8] text-[#48331E] border-[#d8c2aa]">
                  Talla: {sizeOptions[0]}
                </span>
              )}
              {colorOptions[0] && (
                <span className="badge bg-[#e9dac8] text-[#48331E] border-[#d8c2aa] capitalize">
                  Color: {colorOptions[0]}
                </span>
              )}
            </div>
            <div className="text-sm font-semibold text-[#191410]">{priceFmt}</div>
          </div>

          <div className="pt-2 grid grid-cols-2 gap-2">
            <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
              Ver detalle
            </button>
            <button type="button" className="btn btn-ghost" onClick={quickAdd}>
              Agregar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de detalle (puede usar el mismo pickPrice internamente) */}
      <ProductDetailModal open={open} onClose={() => setOpen(false)} product={product} />
    </>
  );
}
