// src/components/browse/BrowsePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { cx, norm, toggleSet } from "./helpers";

export default function BrowsePage({
  title,                  // string | (slug)=>string
  subtitle,               // string opcional
  fetcher,                // async (params)=> { data?, meta? } | []
  deriveParams,           // (filters)=>params
  deriveFacets = () => ({}),   // ✅ fallback seguro
  renderCard = () => null,     // ✅ fallback seguro
  perPage = 12,
  slug,                   // opcional (ej: category slug)
}) {
  // ===== Filtros =====
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState(""); // "", "male", "female"
  const [sizesSel, setSizesSel] = useState(new Set());
  const [colorsSel, setColorsSel] = useState(new Set());
  const [categoriesSel, setCategoriesSel] = useState(new Set()); // ✅ categorías
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ===== Data =====
  const [rowsServer, setRowsServer] = useState([]);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, per_page: perPage, total: 0, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  // ===== Fetch =====
  const doFetch = async (opts = {}) => {
    setLoading(true); setError(null);
    try {
      const filters = {
        search,
        gender,
        sizesSel,
        colorsSel,
        categoriesSel,                       // ✅ Set seleccionado
        categories: Array.from(categoriesSel), // ✅ Array útil para deriveParams
        page: opts.page ?? page,
        per_page: perPage,
        slug,
      };

      const params = deriveParams(filters);
      const res = await fetcher(params);

      const data =
        (Array.isArray(res) && res) ||
        (Array.isArray(res?.data) && res.data) ||
        (Array.isArray(res?.data?.data) && res.data.data) ||
        (Array.isArray(res?.items) && res.items) ||
        [];

      const m = res?.meta ?? res?.data?.meta ?? {
        current_page: res?.current_page ?? res?.data?.current_page ?? params.page ?? 1,
        per_page: res?.per_page ?? res?.data?.per_page ?? perPage,
        total: res?.total ?? res?.data?.total ?? (Array.isArray(data) ? data.length : 0),
        last_page: res?.last_page ?? res?.data?.last_page ?? 1,
      };

      setRowsServer(Array.isArray(data) ? data : []);
      setMeta({
        current_page: Number(m.current_page ?? 1),
        per_page: Number(m.per_page ?? perPage),
        total: Number(m.total ?? (Array.isArray(data) ? data.length : 0)),
        last_page: Number(m.last_page ?? 1),
      });
    } catch (e) {
      console.error("Error listando", e);
      setError(e?.response?.data?.message || e?.message || "Error cargando");
      setRowsServer([]); setMeta({ current_page: 1, per_page: perPage, total: 0, last_page: 1 });
    } finally { setLoading(false); }
  };

  // Primera carga / cambio de slug
  useEffect(() => { setPage(1); doFetch({ page: 1 }); /* eslint-disable-next-line */ }, [slug]);

  // Facetas (derivadas del server)
  const facets = useMemo(
    () => deriveFacets(rowsServer, { search, gender }),
    [rowsServer, search, gender, deriveFacets]
  );

  // Filtrado en cliente (texto + género + sets)
  useEffect(() => {
    const s = norm(search);
    const filtered = rowsServer.filter((p) => {
      const okGender = !gender || p.gender === gender;

      const pSizes = (facets.mapSizes?.get(p) ?? p.sizes ?? []).map(String);
      const pColors = (facets.mapColors?.get(p) ?? p.colors ?? []).map(String);

      // ✅ Categorías del item: usa mapCategories si viene; si no, intenta heurísticas comunes
      const pCatsRaw =
        facets.mapCategories?.get(p) ??
        (Array.isArray(p.categories) ? p.categories :
          [p.category_slug, p.category_id, p.category?.slug, p.category?.name].filter(Boolean));
      const pCategories = (pCatsRaw ?? []).map(String);

      const okSize = sizesSel.size === 0 || pSizes.some((x) => sizesSel.has(x));
      const okColor = colorsSel.size === 0 || pColors.some((x) => colorsSel.has(x));
      const okCategory = categoriesSel.size === 0 || pCategories.some((x) => categoriesSel.has(x));

      const okText =
        s === "" ||
        (p.name && p.name.toLowerCase().includes(s)) ||
        (p.slug && p.slug.toLowerCase().includes(s)) ||
        (p.description && p.description.toLowerCase().includes(s));

      return okGender && okSize && okColor && okCategory && okText;
    });
    setRows(filtered);
  }, [
    rowsServer, search, gender, sizesSel, colorsSel, categoriesSel,
    facets.mapSizes, facets.mapColors, facets.mapCategories
  ]);

  // Acciones
  const onApplyFilters = (e) => { e?.preventDefault?.(); setPage(1); doFetch({ page: 1 }); setFiltersOpen(false); };
  const onClear = () => {
    setSearch("");
    setGender("");
    setSizesSel(new Set());
    setColorsSel(new Set());
    setCategoriesSel(new Set()); // ✅ reset categorías
    setPage(1);
    doFetch({ page: 1 });
  };

  return (
    <section className="py-12 bg-base min-h-screen">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex items-end justify-between gap-3">
          <div className="text-left">
            <p className="text-sm text-muted font-semibold uppercase tracking-wide">Categoría</p>
            <h1 className="text-3xl md:text-4xl font-extrabold mt-1 text-base">
              {typeof title === "function" ? title(slug) : title}
            </h1>
            {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
            <p className="text-xs text-muted mt-1">
              {rows.length} resultado{rows.length === 1 ? "" : "s"}
            </p>
          </div>

          {/* Toggle filtros (móvil) */}
          <button
            type="button"
            className="md:hidden btn btn-ghost is-sm"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            aria-controls="drawer-filtros"
          >
            {filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        </div>

        {error && (
          <div className="card p-3 mb-6 border border-destructive/50">
            <div className="text-sm">
              <span className="font-semibold text-destructive-foreground bg-destructive/15 px-1.5 py-0.5 rounded mr-2">
                Error
              </span>
              <span className="text-base">{error}</span>
            </div>
          </div>
        )}

        {/* Layout principal */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Sidebar filtros */}
          <aside className="md:col-span-4 lg:col-span-3">
            <div
              id="drawer-filtros"
              className={cx(
                "md:static md:translate-x-0 md:opacity-100",
                "fixed inset-x-0 top-[calc(64px+48px)] z-30 md:z-auto",
                "transition-all duration-300",
                filtersOpen
                  ? "translate-y-0 opacity-100"
                  : "-translate-y-4 opacity-0 pointer-events-none md:pointer-events-auto md:opacity-100 md:translate-y-0"
              )}
            >
              <form onSubmit={onApplyFilters} className="card p-4 md:p-5 space-y-5 md:sticky md:top-6" aria-label="Filtros de productos">
                {/* Buscar */}
                <div className="field">
                  <label className="label">Buscar</label>
                  <input
                    className="input"
                    placeholder="Nombre, slug o descripción"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* Género */}
                <div>
                  <label className="label mb-2">Género</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { v: "", t: "Todos" },
                      { v: "male", t: "Hombre" },
                      { v: "female", t: "Mujer" },
                    ].map((g) => {
                      const active = gender === g.v;
                      return (
                        <button
                          key={g.v || "all"}
                          type="button"
                          onClick={() => setGender(g.v)}
                          className={cx(
                            "rounded-full text-xs font-semibold transition active:scale-95",
                            "border is-sm px-3",
                            active ? "btn btn-primary is-sm !rounded-full" : "btn btn-outline is-sm !rounded-full"
                          )}
                          aria-pressed={active}
                        >
                          {g.t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Categorías */}
                {"categories" in facets && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="label">Categorías</label>
                      {categoriesSel.size > 0 && (
                        <button
                          type="button"
                          onClick={() => setCategoriesSel(new Set())}
                          className="text-[11px] text-muted hover:underline"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {facets.categories.length === 0 ? (
                        <span className="text-xs text-muted">Sin categorías</span>
                      ) : (
                        facets.categories.map((item) => {
                          // Soporta: "deporte"  |  { key, label }  |  { id/slug/name/title }
                          const key =
                            typeof item === "string"
                              ? item
                              : (item.key ?? item.id ?? item.slug ?? String(item.label ?? item.name ?? item.title ?? item));
                          const label =
                            typeof item === "string"
                              ? item
                              : (item.label ?? item.name ?? item.title ?? String(key));
                          const k = String(key);
                          const active = categoriesSel.has(k);
                          const n = facets.countCategories?.get(k) || 0;

                          return (
                            <button
                              type="button"
                              key={k}
                              onClick={() => toggleSet(setCategoriesSel)(k)}
                              className={cx(
                                "rounded-full text-xs font-semibold capitalize transition active:scale-95",
                                "border is-sm px-3",
                                active ? "btn btn-primary is-sm !rounded-full" : "btn btn-outline is-sm !rounded-full"
                              )}
                              aria-pressed={active}
                              title={n ? `Disponibles: ${n}` : undefined}
                            >
                              {label} {n ? `(${n})` : ""}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Tallas */}
                {"sizes" in facets && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="label">Tallas</label>
                      {sizesSel.size > 0 && (
                        <button type="button" onClick={() => setSizesSel(new Set())} className="text-[11px] text-muted hover:underline">
                          Limpiar
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {facets.sizes.length === 0 ? (
                        <span className="text-xs text-muted">Sin tallas</span>
                      ) : (
                        facets.sizes.map((s) => {
                          const active = sizesSel.has(s);
                          const c = facets.countSizes?.get(s) || 0;
                          return (
                            <button
                              type="button"
                              key={s}
                              onClick={() => toggleSet(setSizesSel)(s)}
                              className={cx(
                                "rounded-full text-xs font-semibold transition active:scale-95",
                                "border is-sm px-3",
                                active ? "btn btn-primary is-sm !rounded-full" : "btn btn-outline is-sm !rounded-full"
                              )}
                              aria-pressed={active}
                              title={c ? `Disponibles: ${c}` : undefined}
                            >
                              {s} {c ? `(${c})` : ""}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Colores */}
                {"colors" in facets && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="label">Colores</label>
                      {colorsSel.size > 0 && (
                        <button type="button" onClick={() => setColorsSel(new Set())} className="text-[11px] text-muted hover:underline">
                          Limpiar
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {facets.colors.length === 0 ? (
                        <span className="text-xs text-muted">Sin colores</span>
                      ) : (
                        facets.colors.map((c) => {
                          const active = colorsSel.has(c);
                          const n = facets.countColors?.get(c) || 0;
                          return (
                            <button
                              type="button"
                              key={c}
                              onClick={() => toggleSet(setColorsSel)(c)}
                              className={cx(
                                "rounded-full text-xs font-semibold capitalize transition active:scale-95",
                                "border is-sm px-3",
                                active ? "btn btn-primary is-sm !rounded-full" : "btn btn-outline is-sm !rounded-full"
                              )}
                              aria-pressed={active}
                              title={n ? `Disponibles: ${n}` : undefined}
                            >
                              {c} {n ? `(${n})` : ""}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" className="btn btn-ghost" onClick={onClear}>Limpiar</button>
                  <button className="btn btn-primary" type="submit">Aplicar</button>
                </div>
              </form>
            </div>
          </aside>

          {/* Grid */}
          <section className="md:col-span-8 lg:col-span-9">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {loading &&
                Array.from({ length: 9 }).map((_, i) => (
                  <div key={`sk-${i}`} className="card overflow-hidden animate-pulse">
                    <div className="w-full aspect-[4/3] surface-muted" />
                    <div className="p-4 space-y-2">
                      <div className="h-6 surface-muted rounded" />
                      <div className="h-4 surface-muted rounded w-2/3" />
                    </div>
                  </div>
                ))}

              {!loading && rows.map((item, i) => renderCard(item, i))}

              {!loading && rows.length === 0 && !error && (
                <div className="col-span-full text-center text-muted">No hay resultados con los filtros aplicados.</div>
              )}
            </div>

            {/* Paginación */}
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted">
                Página {meta.current_page} de {meta.last_page} · {meta.total} items
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-outline"
                  disabled={meta.current_page <= 1}
                  onClick={() => { const p = meta.current_page - 1; setPage(p); doFetch({ page: p }); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                >
                  ← Anterior
                </button>
                <button
                  className="btn btn-outline"
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => { const p = meta.current_page + 1; setPage(p); doFetch({ page: p }); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
