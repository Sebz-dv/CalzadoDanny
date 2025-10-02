// src/pages/category/CategoryBrowse.jsx
import React from "react";
import { useParams } from "react-router-dom";
import BrowsePage from "../../components/browse/BrowsePage";
import { uniqCI, sizesOf, colorsOf } from "../../components/browse/helpers";
import { listProducts } from "../../services/products/productsService";
import ProductCard from "../products/ProductCard";

export default function CategoryBrowse() {
  const { slug } = useParams();

  return (
    <BrowsePage
      slug={slug}
      title={(s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "Categoría")}
      perPage={12}
      fetcher={listProducts}
      deriveParams={({ search, gender, page, per_page, slug }) => ({
        category_slug: slug,
        search: search || undefined,
        gender: gender || undefined,
        status: "published",
        page,
        per_page,
      })}
      deriveFacets={(rowsServer, { search, gender }) => {
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
      }}
      renderCard={(p, i) => <ProductCard key={p.id ?? i} product={p} idx={i} />}
    />
  );
}
