// src/pages/Explore.jsx
import React, { useMemo, useState } from "react";
import BrowsePage from "../components/browse/BrowsePage";
import { uniqCI, sizesOf, colorsOf } from "../components/browse/helpers";
import { listProducts } from "../services/products/productsService";
import { listCategories } from "../services/products/../categories/categoriesService"; 
// ^ Ajusta el path real de listCategories si vive en otro directorio.
//   Por lo que pegaste, lo tenías en: src/services/products/../../services/... 
//   Si tu listCategories está en "src/services/categories/categoriesService.js":
//   => import { listCategories } from "../services/categories/categoriesService";

import ProductCard from "./products/ProductCard";

/* Card mínima para categorías (si ya tienes una, usa esa) */
function CategoryCard({ category }) {
  const title = category?.name ?? category?.title ?? "Sin nombre";
  const color = category?.color ?? "";
  const img = category?.image_url || category?.image || null;

  return (
    <div className="card overflow-hidden">
      <div className="w-full aspect-[4/3] surface-muted relative">
        {img ? (
          <img
            src={img}
            alt={category?.image_alt || title}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-base">{title}</h3>
        {color ? <p className="text-xs text-muted mt-1 capitalize">Color: {color}</p> : null}
      </div>
    </div>
  );
}

/* Tabs / segmentos arriba del BrowsePage */
function Segmented({ value, onChange }) {
  const tabs = [
    { key: "products", label: "Productos" },
    { key: "categories", label: "Categorías" },
    // Si luego agregas marcas: { key: "brands", label: "Marcas" }
  ];
  return (
    <div className="mb-6">
      <div className="inline-flex bg-[hsl(var(--muted))] border border-subtle rounded-full p-1 shadow-soft">
        {tabs.map((t) => {
          const active = value === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onChange(t.key)}
              className={[
                "px-4 py-1.5 text-sm font-semibold rounded-full transition",
                active
                  ? "btn btn-primary is-sm !rounded-full"
                  : "btn btn-ghost is-sm !rounded-full"
              ].join(" ")}
              aria-pressed={active}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Explore() {
  const [tab, setTab] = useState("products");

  // Config por pestaña (fetcher, params, facetas, card)
  const config = useMemo(() => {
    if (tab === "products") {
      return {
        title: "Productos",
        fetcher: listProducts,
        deriveParams: ({ search, gender, page, per_page }) => ({
          search: search || undefined,
          gender: gender || undefined,
          status: "published",
          page,
          per_page,
        }),
        deriveFacets: (rowsServer, { search, gender }) => {
          // Misma lógica que usas en CategoryBrowse para tallas/colores
          const s = (search || "").toLowerCase();
          const base = rowsServer.filter((p) => {
            const okGender = !gender || p.gender === gender;
            const okText =
              s === "" ||
              (p.name || "").toLowerCase().includes(s) ||
              (p.slug || "").toLowerCase().includes(s) ||
              (p.description || "").toLowerCase().includes(s);
            return okGender && okText;
          });

          const sizes = uniqCI(base.flatMap(sizesOf).map(String).filter(Boolean));
          const colors = uniqCI(base.flatMap(colorsOf).map(String).filter(Boolean));

          const countSizes = new Map();
          const countColors = new Map();
          base.forEach((p) => {
            sizesOf(p).forEach((sz) => countSizes.set(sz, (countSizes.get(sz) || 0) + 1));
            colorsOf(p).forEach((co) => countColors.set(co, (countColors.get(co) || 0) + 1));
          });

          const mapSizes = new Map();
          const mapColors = new Map();
          rowsServer.forEach((p) => {
            mapSizes.set(p, sizesOf(p).map(String));
            mapColors.set(p, colorsOf(p).map(String));
          });

          return { sizes, colors, countSizes, countColors, mapSizes, mapColors };
        },
        renderCard: (p, i) => <ProductCard key={p.id ?? i} product={p} idx={i} />,
      };
    }

    // Categorías: no tiene facetas (oculta bloques de tallas/colores)
    return {
      title: "Categorías",
      fetcher: listCategories,
      deriveParams: ({ search, page, per_page }) => ({
        search: search || undefined,
        page,
        per_page,
        status: "published",
      }),
      deriveFacets: () => ({}), // <- devuelve vacío y BrowsePage no muestra facetas
      renderCard: (c, i) => <CategoryCard key={c.id ?? i} category={c} />,
    };
  }, [tab]);

  return (
    <section className="py-12 bg-base min-h-screen">
      <div className="container mx-auto px-4">
        {/* Selector de pestaña */}
        <Segmented value={tab} onChange={setTab} />

        {/* El escenario que pinta todo */}
        <BrowsePage
          title={config.title}
          fetcher={config.fetcher}
          deriveParams={config.deriveParams}
          deriveFacets={config.deriveFacets}
          renderCard={config.renderCard}
          perPage={12}
        />
      </div>
    </section>
  );
}
