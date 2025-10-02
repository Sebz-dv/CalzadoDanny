import React, { useEffect, useState } from "react";
import {
  listSlides,
  createSlide,
  updateSlide,
  deleteSlide,
  toggleSlide,
} from "../../services/carrusel/slidesService.js";

export default function Carrusel() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  // Campos del formulario
  const [title, setTitle] = useState("");
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState(null);
  const [mobileImage, setMobileImage] = useState(null);

  async function fetchData(page = 1) {
    setLoading(true);
    try {
      const res = await listSlides({ page });
      setItems(res.data);
      setMeta(res.meta);
    } catch (e) {
      console.error(e);
      alert(e.message || "No se pudo cargar el listado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData(1);
  }, []);

  function openCreate() {
    setEditing(null);
    setTitle("");
    setAlt("");
    setCaption("");
    setIsActive(true);
    setImage(null);
    setMobileImage(null);
    setShowForm(true);
  }

  function openEdit(s) {
    setEditing(s);
    setTitle(s.title || "");
    setAlt(s.alt || "");
    setCaption(s.caption || "");
    setIsActive(!!s.is_active);
    setImage(null);
    setMobileImage(null);
    setShowForm(true);
  }

  async function handleSubmit(e) {
  e.preventDefault();

  // Reglas mínimas para crear
  if (!editing && !image) {
    alert("Selecciona una imagen (jpg/png/webp, máx 4MB).");
    return;
  }
  if (image) {
    const ok = ["image/jpeg","image/jpg","image/png","image/webp"];
    if (!ok.includes(image.type)) {
      alert("Formato no válido. Usa JPG, PNG o WEBP.");
      return;
    }
    if (image.size > 4 * 1024 * 1024) {
      alert("La imagen supera 4MB.");
      return;
    }
  }

  try {
    if (editing) {
      await updateSlide(editing.id, {
        title, alt, caption, is_active: isActive,
        image, mobile_image: mobileImage,
      });
    } else {
      await createSlide({
        title, alt, caption, is_active: isActive,
        image, mobile_image: mobileImage, // <- REQUERIDA en create
      });
    }
    setShowForm(false);
    await fetchData(meta?.current_page || 1);
  } catch (err) {
    // Muestra los errores del backend de forma decente
    const msg = err?.response?.data?.message || err.message || "Error";
    const details = err?.response?.data?.errors
      ? Object.values(err.response.data.errors).flat().join("\n")
      : "";
    alert([msg, details].filter(Boolean).join("\n"));
    console.error(err?.response?.data || err);
  }
}


  async function handleDelete(id) {
    if (!confirm("¿Eliminar este slide?")) return;
    try {
      await deleteSlide(id);
      await fetchData(meta?.current_page || 1);
    } catch (e) {
      console.error(e);
      alert(e.message || "No se pudo eliminar");
    }
  }

  async function handleToggle(id) {
    try {
      const updated = await toggleSlide(id);
      setItems((xs) => xs.map((x) => (x.id === id ? updated : x)));
    } catch (e) {
      console.error(e);
      alert(e.message || "No se pudo cambiar el estado");
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Carrusel – Admin (CRUD)</h2>
        <button
          onClick={openCreate}
          className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          + Nuevo
        </button>
      </div>

      {/* Formulario simple */}
      {showForm && (
        <form onSubmit={handleSubmit} className="grid gap-3 rounded border p-4">
          <div className="grid gap-2">
            <label className="text-sm">Título</label>
            <input
              className="border rounded px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Promo verano"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Alt (accesibilidad)</label>
            <input
              className="border rounded px-3 py-2"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Descripción de la imagen"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Caption (opcional)</label>
            <textarea
              className="border rounded px-3 py-2"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label htmlFor="is_active">Activo</label>
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Imagen (requerida al crear)</label>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Imagen móvil (opcional)</label>
            <input type="file" accept="image/*" onChange={(e) => setMobileImage(e.target.files?.[0] ?? null)} />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-2 rounded border hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            >
              {editing ? "Guardar cambios" : "Crear"}
            </button>
          </div>
        </form>
      )}

      {/* Tabla simple */}
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 text-left">Preview</th>
              <th className="p-2 text-left">Título</th>
              <th className="p-2 text-left">Caption</th>
              <th className="p-2 text-left">Estado</th>
              <th className="p-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">Cargando…</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">
                No hay slides. <button onClick={openCreate} className="underline text-blue-600">Crear uno</button>
              </td></tr>
            )}
            {!loading && items.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-2">
                  {s.image_url
                    ? <img src={s.image_url} className="h-12 w-20 object-cover rounded" />
                    : <div className="h-12 w-20 bg-gray-200 rounded" />
                  }
                </td>
                <td className="p-2">{s.title || <span className="text-gray-500">(sin título)</span>}</td>
                <td className="p-2 truncate max-w-[280px]">{s.caption}</td>
                <td className="p-2">{s.is_active ? "Activo" : "Inactivo"}</td>
                <td className="p-2 text-right">
                  <div className="inline-flex gap-2">
                    <button
                      onClick={() => handleToggle(s.id)}
                      className="px-2 py-1 rounded border hover:bg-gray-50"
                      title="Activar/Desactivar"
                    >
                      Toggle
                    </button>
                    <button
                      onClick={() => openEdit(s)}
                      className="px-2 py-1 rounded border hover:bg-gray-50"
                      title="Editar"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                      title="Eliminar"
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

      {/* Paginación mínima */}
      {meta && (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => fetchData(Math.max(1, meta.current_page - 1))}
            disabled={meta.current_page <= 1}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            ←
          </button>
          <span className="text-sm">
            {meta.current_page} / {meta.last_page}
          </span>
          <button
            onClick={() => fetchData(Math.min(meta.last_page, meta.current_page + 1))}
            disabled={meta.current_page >= meta.last_page}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
