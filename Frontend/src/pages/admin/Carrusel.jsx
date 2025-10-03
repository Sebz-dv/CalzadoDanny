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

    if (!editing && !image) {
      alert("Selecciona una imagen (jpg/png/webp).");
      return;
    }
    if (image) {
      const ok = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!ok.includes(image.type)) {
        alert("Formato no válido. Usa JPG, PNG o WEBP.");
        return;
      }
    }

    try {
      if (editing) {
        await updateSlide(editing.id, {
          title,
          alt,
          caption,
          is_active: isActive,
          image,
          mobile_image: mobileImage,
        });
      } else {
        await createSlide({
          title,
          alt,
          caption,
          is_active: isActive,
          image,
          mobile_image: mobileImage,
        });
      }
      setShowForm(false);
      await fetchData(meta?.current_page || 1);
    } catch (err) {
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
        <button onClick={openCreate} className="btn btn-primary">
          + Nuevo
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleSubmit} className="grid gap-3 card p-4">
          <div className="grid gap-2">
            <label className="text-sm">Título</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Promo verano"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Alt (accesibilidad)</label>
            <input
              className="input"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Descripción de la imagen"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Caption (opcional)</label>
            <textarea
              className="textarea"
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
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Imagen móvil (opcional)</label>
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={(e) => setMobileImage(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn btn-ghost"
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editing ? "Guardar cambios" : "Crear"}
            </button>
          </div>
        </form>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto card">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left">Preview</th>
              <th className="p-2 text-left">Título</th>
              <th className="p-2 text-left">Caption</th>
              <th className="p-2 text-left">Estado</th>
              <th className="p-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted">
                  No hay slides.{" "}
                  <button onClick={openCreate} className="btn btn-ghost">
                    Crear uno
                  </button>
                </td>
              </tr>
            )}
            {!loading &&
              items.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-2">
                    {s.image_url ? (
                      <img
                        src={s.image_url}
                        alt={s.alt || s.title || `Slide ${s.id}`}
                        className="h-12 w-20 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.objectFit = "contain";
                          e.currentTarget.src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="96"><rect width="100%" height="100%" fill="%23eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="Arial" font-size="12">sin imagen</text></svg>';
                        }}
                      />
                    ) : (
                      <div className="h-12 w-20 bg-muted rounded" />
                    )}
                  </td>
                  <td className="p-2">
                    {s.title || (
                      <span className="text-muted">(sin título)</span>
                    )}
                  </td>
                  <td className="p-2 truncate max-w-[280px]">{s.caption}</td>
                  <td className="p-2">
                    {s.is_active ? (
                      <span className="badge badge-success">Activo</span>
                    ) : (
                      <span className="badge badge-destructive">Inactivo</span>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => handleToggle(s.id)}
                        className="btn btn-info"
                        title="Activar/Desactivar"
                      >
                        {s.is_active ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        onClick={() => openEdit(s)}
                        className="btn btn-ghost"
                        title="Editar"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="btn btn-destructive"
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

      {/* Paginación */}
      {meta && (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => fetchData(Math.max(1, meta.current_page - 1))}
            disabled={meta.current_page <= 1}
            className="btn btn-ghost"
          >
            ←
          </button>
          <span className="text-sm">
            {meta.current_page} / {meta.last_page}
          </span>
          <button
            onClick={() =>
              fetchData(Math.min(meta.last_page, meta.current_page + 1))
            }
            disabled={meta.current_page >= meta.last_page}
            className="btn btn-ghost"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
