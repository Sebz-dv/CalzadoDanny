import React, { useEffect, useMemo, useState } from "react";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategory,
} from "../../services/categories/categoriesService";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

const emptyForm = {
  name: "",
  slug: "",
  subtitle: "",
  description: "",
  color: "",
  position: 0,
  is_featured: false,
  status: "published",
  image: undefined, // File | undefined | null (null => limpiar en backend)
  image_alt: "",
};

export default function CategoriesPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const res = await listCategories({
        search: q,
        per_page: 10,
        page,
        sort_by: "position",
        sort_dir: "asc",
      });
      setRows(res.data ?? res);
      setMeta(res.meta ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(
    () => () => {
      if (preview?.startsWith?.("blob:")) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    if (preview?.startsWith?.("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name ?? "",
      slug: row.slug ?? "",
      subtitle: row.subtitle ?? "",
      description: row.description ?? "",
      color: row.color ?? "",
      position: row.position ?? 0,
      is_featured: !!row.is_featured,
      status: row.status ?? "published",
      image: undefined,
      image_alt: row.image_alt ?? "",
    });
    if (preview?.startsWith?.("blob:")) URL.revokeObjectURL(preview);
    setPreview(row.image_url ?? null);
    setModalOpen(true);
  };

  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    setForm((f) => ({ ...f, image: file }));
    if (preview?.startsWith?.("blob:")) URL.revokeObjectURL(preview);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const onClearImage = () => {
    setForm((f) => ({ ...f, image: null, image_alt: "" }));
    if (preview?.startsWith?.("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const onSave = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    try {
      if (editingId) await updateCategory(editingId, form);
      else await createCategory(form);
      setModalOpen(false);
      await fetchData(meta?.current_page ?? 1);
    } catch (err) {
      console.error("Create/Update failed", err?.response?.data);
      alert(
        JSON.stringify(
          err?.response?.data?.errors ?? err?.response?.data ?? err?.message,
          null,
          2
        )
      );
    } finally {
      setSaving(false);
      if (preview?.startsWith?.("blob:")) URL.revokeObjectURL(preview);
      setPreview(null);
      setForm(emptyForm);
    }
  };

  const onDelete = async (id) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    await deleteCategory(id);
    await fetchData(meta?.current_page ?? 1);
  };

  const onToggle = async (id) => {
    await toggleCategory(id);
    await fetchData(meta?.current_page ?? 1);
  };

  const filtered = useMemo(() => rows, [rows]);

  return (
    <div className="p-4 md:p-6">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar categoría…"
          className="input md:max-w-sm"
        />
        <button onClick={() => fetchData()} className="btn btn-ghost">
          Buscar
        </button>
        <button onClick={openCreate} className="ml-auto btn btn-primary">
          Nueva
        </button>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-3 py-2">#</th>
              <th className="text-left px-3 py-2">Nombre</th>
              <th className="text-left px-3 py-2">Slug</th>
              <th className="text-left px-3 py-2">Estado</th>
              <th className="text-left px-3 py-2">Destacada</th>
              <th className="text-left px-3 py-2">Posición</th>
              <th className="text-right px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted">
                  Sin resultados
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-base">
                  <td className="px-3 py-2">{r.id}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-app overflow-hidden bg-muted border border-base">
                        {r.image_url ? (
                          <img
                            src={r.image_url}
                            alt={r.image_alt ?? r.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        {r.color && (
                          <span
                            className="inline-block w-3 h-3 rounded-full border border-base"
                            style={{ background: r.color }}
                          />
                        )}
                        <span className="font-medium">{r.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">{r.slug}</td>
                  <td className="px-3 py-2">
                    <span
                      className={cx(
                        "badge",
                        r.status === "published" && "badge-success",
                        r.status === "draft" && "badge-warning",
                        r.status === "archived" && "badge-info"
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => onToggle(r.id)}
                      className={cx(
                        "btn btn-ghost text-xs px-2 py-1",
                        r.is_featured && "bg-primary/10 text-primary ring-brand"
                      )}
                      title="Alternar destacada"
                    >
                      {r.is_featured ? "Sí" : "No"}
                    </button>
                  </td>
                  <td className="px-3 py-2">{r.position ?? 0}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => openEdit(r)}
                        className="btn btn-ghost px-2 py-1"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(r.id)}
                        className="btn btn-destructive px-2 py-1"
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[95vw] max-w-xl card p-5 shadow-strong">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">
                {editingId ? "Editar categoría" : "Nueva categoría"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="btn btn-ghost px-3 py-1"
              >
                ×
              </button>
            </div>

            <form onSubmit={onSave} className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-sm text-muted">Nombre</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  maxLength={120}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted">Slug (opcional)</label>
                  <input
                    className="input"
                    value={form.slug}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, slug: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-muted">
                    Color (hex o clase)
                  </label>
                  <input
                    className="input"
                    value={form.color}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, color: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-muted">Subtítulo</label>
                <input
                  className="input"
                  value={form.subtitle}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subtitle: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="text-sm text-muted">Descripción</label>
                <textarea
                  className="textarea min-h-[80px]"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>

              {/* Imagen + preview */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-start">
                <div>
                  <label className="text-sm text-muted">Imagen</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onPickImage}
                    className="input"
                  />
                  <p className="mt-1 text-xs text-muted">
                    JPG, PNG, WEBP o AVIF. Máx 4&nbsp;MB.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="w-28 h-28 rounded-app overflow-hidden bg-muted border border-base flex items-center justify-center">
                    {preview ? (
                      <img
                        src={preview}
                        alt={form.image_alt || "Preview"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-muted px-2 text-center">
                        Sin imagen
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onClearImage}
                      className="btn btn-ghost px-2 py-1"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted">
                  Texto alternativo (SEO/Accesibilidad)
                </label>
                <input
                  className="input"
                  value={form.image_alt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, image_alt: e.target.value }))
                  }
                  maxLength={160}
                  placeholder="Ej. Ícono de productos electrónicos"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-muted">Posición</label>
                  <input
                    type="number"
                    min={0}
                    className="input"
                    value={form.position}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        position: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-muted">Estado</label>
                  <select
                    className="select"
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value }))
                    }
                  >
                    <option value="published">published</option>
                    <option value="draft">draft</option>
                    <option value="archived">archived</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.is_featured}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          is_featured: e.target.checked,
                        }))
                      }
                    />
                    <span>Destacada</span>
                  </label>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? "Guardando…" : editingId ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Paginación */}
      {meta && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="text-muted">
            Página {meta.current_page} de {meta.last_page}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={!meta.prev_page_url}
              onClick={() => fetchData(meta.current_page - 1)}
              className="btn btn-ghost disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              disabled={!meta.next_page_url}
              onClick={() => fetchData(meta.current_page + 1)}
              className="btn btn-ghost disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
