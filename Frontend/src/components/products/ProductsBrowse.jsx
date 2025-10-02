// src/pages/products/ProductsBrowse.jsx
import React from "react";
import BrowsePage from "../../components/browse/BrowsePage";
import { uniqCI, sizesOf, colorsOf } from "../../components/browse/helpers";
import { listProducts } from "../../services/products/productsService";
import ProductCard from "./ProductCard";

// Extrae pares { key, label } de las categorías de un producto
const catPairsOf = (p) => {
  const out = [];
  if (Array.isArray(p?.categories) && p.categories.length) {
    for (const c of p.categories) {
      const key = String(c?.slug ?? c?.id ?? c?.name ?? "").trim();
      if (!key) continue;
      const label = String(c?.name ?? c?.title ?? c?.slug ?? key);
      out.push({ key, label });
    }
  } else {
    const key = String(
      p?.category?.slug ?? p?.category_slug ?? p?.category_id ?? ""
    ).trim();
    if (key) {
      const label = String(
        p?.category?.name ??
          p?.category_name ??
          p?.category?.title ??
          p?.category_slug ??
          key
      );
      out.push({ key, label });
    }
  }
  return out;
};

export default function ProductsBrowse() {
  return (
    <BrowsePage
      title="Productos"
      perPage={12}
      fetcher={listProducts}
      // 👇 Si tu backend espera otro nombre (ej. category_slugs[]), cámbialo aquí
      deriveParams={({ search, gender, page, per_page, categories }) => ({
        search: search || undefined,
        gender: gender || undefined,
        categories: categories?.length ? categories : undefined, // array de keys
        status: "published",
        page,
        per_page,
      })}
      deriveFacets={(rowsServer, { search, gender }) => {
        const s = (search || "").toLowerCase();

        // Base filtrada por texto/género para los conteos (facetas dinámicas)
        const base = rowsServer.filter((p) => {
          const okGender = !gender || p.gender === gender;
          const okText =
            s === "" ||
            (p.name || "").toLowerCase().includes(s) ||
            (p.slug || "").toLowerCase().includes(s) ||
            (p.description || "").toLowerCase().includes(s);
          return okGender && okText;
        });

        // ===== Tallas/Colores (igual que antes) =====
        const sizes = uniqCI(base.flatMap(sizesOf).map(String).filter(Boolean));
        const colors = uniqCI(base.flatMap(colorsOf).map(String).filter(Boolean));

        const countSizes = new Map();
        const countColors = new Map();
        base.forEach((p) => {
          sizesOf(p).forEach((sz) =>
            countSizes.set(sz, (countSizes.get(sz) || 0) + 1)
          );
          colorsOf(p).forEach((co) =>
            countColors.set(co, (countColors.get(co) || 0) + 1)
          );
        });

        const mapSizes = new Map();
        const mapColors = new Map();
        rowsServer.forEach((p) => {
          mapSizes.set(p, sizesOf(p).map(String));
          mapColors.set(p, colorsOf(p).map(String));
        });

        // ===== Categorías =====
        // Conteos y labels solo con la "base" (dependen de search/género)
        const labelsByKey = new Map(); // key -> label
        const countCategories = new Map(); // key -> count
        base.forEach((p) => {
          const pairs = catPairsOf(p);
          pairs.forEach(({ key, label }) => {
            const k = String(key);
            labelsByKey.set(k, String(label));
            countCategories.set(k, (countCategories.get(k) || 0) + 1);
          });
        });

        // Mapa de categorías por item para el filtrado en cliente (usar TODOS los rowsServer)
        const mapCategories = new Map(); // product -> [key...]
        rowsServer.forEach((p) => {
          const pairs = catPairsOf(p);
          const keys = pairs.map(({ key }) => String(key));
          mapCategories.set(p, keys);
        });

        // Lista de categorías para el UI (soporta { key, label })
        const categories = Array.from(labelsByKey.entries())
          .map(([key, label]) => ({ key, label }))
          .sort((a, b) => a.label.localeCompare(b.label, "es"));

        return {
          // facetas clásicas
          sizes,
          colors,
          countSizes,
          countColors,
          mapSizes,
          mapColors, 
          categories,
          countCategories,
          mapCategories,
        };
      }}
      renderCard={(p, i) => <ProductCard key={p.id ?? i} product={p} idx={i} />}
    />
  );
}
