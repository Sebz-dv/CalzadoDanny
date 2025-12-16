// src/pages/admin/ProductsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  listProducts,
  deleteProduct,
} from "../../services/products/productsService";
import ProductModal from "./ProductModal";

export default function ProductsPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: 12,
    total: 0,
    last_page: 1,
  });
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // product o null

  const fetchData = async (opts = {}) => {
    setLoading(true);
    try {
      const params = {
        search: q || undefined,
        page: opts.page ?? page,
        per_page: 12,
      };
      const res = await listProducts(params);

      // Soporta Resource Collection de Laravel (data/meta) o array plano
      const data = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      const m = res?.meta ?? {
        current_page: res?.current_page ?? params.page ?? 1,
        per_page: res?.per_page ?? 12,
        total: res?.total ?? data.length,
        last_page: res?.last_page ?? 1,
      };

      setRows(data);
      setMeta(m);
    } catch (e) {
      console.error("Error listando productos", e);
      setRows([]);
      setMeta({ current_page: 1, per_page: 12, total: 0, last_page: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData({ page: 1 });
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setModalOpen(true);
  };

  const onSaved = () => {
    setModalOpen(false);
    setEditing(null);
    fetchData({ page });
  };

  const onDelete = async (id) => {
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer."))
      return;
    try {
      await deleteProduct(id);
      fetchData({ page });
    } catch (e) {
      console.error("No se pudo eliminar", e);
      alert("No se pudo eliminar el producto.");
    }
  };

  const genderLabel = (g) => {
    const v = String(g || "").toLowerCase();
    if (v === "female" || v === "f") return "Femenino";
    if (v === "male" || v === "m") return "Masculino";
    return "-";
  };

  const canPrev = meta.current_page > 1;
  const canNext = meta.current_page < meta.last_page;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Productos</h1>
        <button onClick={openCreate} className="btn btn-primary">
          Nuevo producto
        </button>
      </div>

      <form onSubmit={onSearch} className="flex gap-2">
        <input
          className="input border border-neutral-400 dark:border-neutral-300"
          placeholder="Buscar por nombre/slug…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn btn-ghost" type="submit">
          Buscar
        </button>
      </form>

      <div className="card overflow-x-auto border border-neutral-400 dark:border-neutral-300">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted border-b border-neutral-400 dark:border-neutral-300"> 
              <th className="text-center p-2">Producto</th>
              <th className="text-center p-2">Categoría</th>
              <th className="text-center p-2">Género</th> 
              <th className="text-center p-2">Estado</th>
              <th className="text-center p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-muted">
                  No hay productos.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-neutral-200 dark:border-neutral-400/80"
                > 
                  <td className="p-2 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      {p.main_image_url ? (
                        <img
                          src={p.main_image_url}
                          alt={p.name}
                          className="w-12 h-12 object-cover rounded-app border border-neutral-400 dark:border-neutral-300"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-app border border-neutral-400 dark:border-neutral-300 bg-muted" />
                      )}
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted">{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-2 text-center">{p.category?.name ?? "-"}</td>
                  <td className="p-2 capitalize text-center">{genderLabel(p.gender)}</td> 
                  <td className="p-2 text-center">
                    <span className="badge border border-neutral-400 dark:border-neutral-300">
                      {p.status}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <div className="inline-flex gap-2">
                      <button
                        className="btn btn-outline is-sm border border-neutral-400 dark:border-neutral-300 dark:text-neutral-100"
                        onClick={() => openEdit(p)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-destructive is-sm"
                        onClick={() => onDelete(p.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted">
          Página {meta.current_page} de {meta.last_page} · {meta.total} items
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-ghost border border-transparent disabled:border-transparent"
            disabled={!canPrev}
            onClick={() => {
              const newPage = meta.current_page - 1;
              setPage(newPage);
              fetchData({ page: newPage });
            }}
          >
            ← Anterior
          </button>
          <button
            className="btn btn-ghost border border-transparent disabled:border-transparent"
            disabled={!canNext}
            onClick={() => {
              const newPage = meta.current_page + 1;
              setPage(newPage);
              fetchData({ page: newPage });
            }}
          >
            Siguiente →
          </button>
        </div>
      </div>

      {/* Modal crear/editar */}
      {modalOpen && (
        <ProductModal
          product={editing}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
