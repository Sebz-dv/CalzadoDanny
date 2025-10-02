// src/components/Category/Categories.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listCategories } from "../../services/categories/categoriesService";

// Pequeño componente para imagen con fallback visual SIN assets locales
function CardImage({ src, alt }) {
  const [broken, setBroken] = useState(false);
  const showImg = !!src && !broken;

  if (showImg) {
    return (
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        loading="lazy"
        onError={() => setBroken(true)}
      />
    );
  }

  // Placeholder visual cuando no hay imagen o falló la carga
  const initials = (alt || "C")
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

export default function Categories() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar categorías reales desde el backend
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await listCategories({
          status: "published",
          per_page: 100,
          sort_by: "position",
          sort_dir: "asc",
        });
        const data = res?.data ?? res ?? [];
        if (alive) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error cargando categorías:", e);
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Normaliza estructura sin META ni imágenes locales
  const items = useMemo(() => {
    return (rows || [])
      .map((c, idx) => {
        const slug = c?.slug || String(c?.id ?? idx);
        // Sin META: usamos lo que venga del backend; si falta name, capitalizamos el slug
        const title =
          c?.name ||
          (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : "Categoría");
        const description = c?.subtitle || c?.description || "";
        // Sin fallbacks locales: solo la URL del backend (si no hay, CardImage pondrá placeholder)
        const img = c?.image_url || c?.image || null;

        return {
          key: String(c?.id ?? slug ?? idx),
          href: `/categories/${slug}`,
          title,
          description,
          img,
          isFeatured: !!c?.is_featured,
          position: Number.isFinite(Number(c?.position)) ? Number(c.position) : 0,
        };
      })
      // Orden final por position y luego por título
      .sort((a, b) => a.position - b.position || a.title.localeCompare(b.title));
  }, [rows]);

  return (
    <section className="py-16 bg-[#FAEAD7]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <p
            data-aos="fade-up"
            className="text-sm text-[#AC9484] font-medium uppercase tracking-wide"
          >
            Explora nuestras colecciones
          </p>
          <h1 data-aos="fade-up" className="text-4xl font-extrabold mt-2 text-[#191410]">
            Categorías
          </h1>
          <p data-aos="fade-up" className="mt-3 text-[#48331E] text-sm md:text-base">
            Encuentra la categoría perfecta que se adapta a tu estilo único.
          </p>
        </div>

        {/* Grid dinámico desde API (mismos estilos) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading &&
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="bg-[#faead738] rounded-xl overflow-hidden shadow-md animate-pulse"
              >
                <div className="w-full aspect-[4/3] bg-[#e9dac8]" />
                <div className="p-4 space-y-2">
                  <div className="h-6 bg-[#e9dac8] rounded" />
                  <div className="h-4 bg-[#e9dac8] rounded w-2/3" />
                </div>
              </div>
            ))}

          {!loading &&
            items.map((category, idx) => (
              <Link
                to={category.href}
                key={category.key}
                data-aos="fade-up"
                data-aos-delay={String(idx * 150)}
                className="bg-[#faead738] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1 block"
              >
                <div className="relative w-full aspect-[4/3] overflow-hidden">
                  <CardImage src={category.img} alt={category.title} />
                  {category.isFeatured && (
                    <span className="absolute top-3 left-3 px-3 py-1 text-xs font-bold rounded-full bg-[#48331E] text-[#FAEAD7]">
                      Destacada
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-2 text-center">
                  <h2 className="font-extrabold text-2xl md:text-3xl text-[#191410]">
                    {category.title}
                  </h2>
                  {category.description ? (
                    <p className="text-sm text-[#48331E]">{category.description}</p>
                  ) : null}
                </div>
              </Link>
            ))}

          {!loading && items.length === 0 && (
            <div className="col-span-full text-center text-[#48331E]">
              No hay categorías publicadas.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
