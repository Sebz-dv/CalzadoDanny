// ProductForm.jsx — crear/editar con galería y orden
import React, { useEffect, useMemo, useState } from "react";
import {
  createProduct,
  updateProduct,
} from "../../services/products/productsService";
import { listCategories } from "../../services/categories/categoriesService";

const GENDER_MAP = {
  male: "male",
  female: "female",
  hombre: "male",
  mujer: "female",
};

export default function ProductForm({ product, onSaved, debug = false }) {
  const [form, setForm] = useState({
    category_id: "",
    name: "",
    slug: "",
    description: "",
    size: "",
    color: "",
    gender: "male",
    status: "published",
    main_image: undefined, // File | null | undefined
    main_image_alt: "",
    images: [],
    images_alt: [],
    // campos “admin” de galería existente:
    remove_image_ids: [],
    images_order: [],
  });

  const [cats, setCats] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // estado derivado de producto para edición
  const [existingImages, setExistingImages] = useState([]); // [{id,url,alt,position,remove:false}]
  const [mainImagePreview, setMainImagePreview] = useState(null); // URL | null

  // ====== cargar categorías ======
  useEffect(() => {
    (async () => {
      try {
        const res = await listCategories();
        const items = Array.isArray(res?.data) ? res.data : res;
        setCats(items || []);
      } catch (e) {
        console.error("Error cargando categorías", e);
        setCats([]);
      }
    })();
  }, []);

  // ====== hidratar formulario en modo edición ======
  useEffect(() => {
    if (!product) {
      setExistingImages([]);
      setMainImagePreview(null);
      return;
    }
    // Prepara formulario base desde product
    setForm((f) => ({
      ...f,
      category_id: product.category_id ?? "",
      name: product.name ?? "",
      slug: product.slug ?? "",
      description: product.description ?? "",
      size: product.size ?? "",
      color: product.color ?? "",
      gender: product.gender ?? "male",
      status: product.status ?? "published",
      // no precargamos File de imagen principal, pero mostramos preview
      main_image: undefined,
      main_image_alt: product.main_image_alt ?? "",
      images: [],
      images_alt: [],
      remove_image_ids: [],
      images_order: (product.images || []).map((img) => img.id),
    }));
    // Galería existente con flags de control
    const sorted = [...(product.images || [])].sort((a, b) => {
      const pa = Number(a.position ?? 0),
        pb = Number(b.position ?? 0);
      return pa === pb ? a.id - b.id : pa - pb;
    });
    setExistingImages(sorted.map((i) => ({ ...i, remove: false })));
    setMainImagePreview(product.main_image_url || null);
  }, [product]);

  // ====== helpers ======
  const onChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onChangeNumber = (k, v) => {
    const n = v === "" ? "" : Number(v);
    onChange(k, Number.isNaN(n) ? "" : n);
  };

  // previsualizar imagen principal nueva
  useEffect(() => {
    if (form.main_image instanceof File) {
      const url = URL.createObjectURL(form.main_image);
      setMainImagePreview(url);
      return () => URL.revokeObjectURL(url);
    } else if (!product) {
      setMainImagePreview(null);
    } else {
      // si estamos editando y no pusimos nueva, mantenemos la del producto
      setMainImagePreview(product?.main_image_url || null);
    }
  }, [form.main_image, product]);

  // marcar/desmarcar para remover imagen existente
  const toggleRemove = (id) => {
    setExistingImages((imgs) =>
      imgs.map((it) => (it.id === id ? { ...it, remove: !it.remove } : it))
    );
  };

  // mover ↑/↓ una imagen existente (solo en UI; luego mandamos order)
  const moveImage = (id, dir) => {
    setExistingImages((imgs) => {
      const arr = [...imgs];
      const idx = arr.findIndex((x) => x.id === id);
      if (idx < 0) return arr;
      const swapWith = dir === "up" ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= arr.length) return arr;
      [arr[idx], arr[swapWith]] = [arr[swapWith], arr[idx]];
      return arr;
    });
  };

  // recopila order y removals antes de enviar
  const computeGalleryAdmin = useMemo(() => {
    const order = existingImages.map((it) => it.id);
    const remove = existingImages.filter((it) => it.remove).map((it) => it.id);
    return { order, remove };
  }, [existingImages]);

  const dumpPayload = (payload) => {
    if (!debug) return;
    console.log("PAYLOAD (pre-FormData)", payload);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const gender = GENDER_MAP[(form.gender || "").toLowerCase()] || "male";
      const category_id = form.category_id ? Number(form.category_id) : "";

      const payload = {
        ...form,
        category_id,
        gender,
        slug: form.slug?.trim() || undefined,
        // admin galería:
        remove_image_ids: computeGalleryAdmin.remove,
        images_order: computeGalleryAdmin.order,
      };

      dumpPayload(payload);

      const saved = product
        ? await updateProduct(product.id, payload)
        : await createProduct(payload);

      onSaved?.(saved);
    } catch (err) {
      console.error("Save failed", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Error desconocido";
      setError(msg);
      if (err?.response?.status === 422) {
        console.warn("Errores de validación:", err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  // limpiar imagen principal (en edición enviamos main_image: null)
  const clearMainImage = () => {
    setForm((f) => ({ ...f, main_image: null }));
    setMainImagePreview(null);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="alert alert-destructive">
          <span className="font-medium">Error:</span>
          <span>{error}</span>
        </div>
      )}

      {/* Categoría */}
      <div className="space-y-1">
        <label className="text-sm text-muted">Categoría</label>
        <select
          value={form.category_id}
          onChange={(e) => onChangeNumber("category_id", e.target.value)}
          required
          className="select"
        >
          <option value="">-- Categoría --</option>
          {(cats?.data ?? cats)?.map?.((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Nombre / Slug */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm text-muted">Nombre</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Nombre"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-muted">Slug (opcional)</label>
          <input
            className="input"
            value={form.slug}
            onChange={(e) => onChange("slug", e.target.value)}
            placeholder="mi-producto-top"
          />
        </div>
      </div>

      {/* Descripción */}
      <div className="space-y-1">
        <label className="text-sm text-muted">Descripción</label>
        <textarea
          className="textarea"
          rows={3}
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Detalles del producto…"
        />
      </div>

      {/* Talla / Color */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm text-muted">Talla</label>
          <input
            className="input"
            value={form.size}
            onChange={(e) => onChange("size", e.target.value)}
            placeholder="M, 36…"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-muted">Color</label>
          <input
            className="input"
            value={form.color}
            onChange={(e) => onChange("color", e.target.value)}
            placeholder="Negro, Azul…"
          />
        </div>
      </div>

      {/* Género */}
      <div className="space-y-1">
        <label className="text-sm text-muted">Género</label>
        <div className="flex gap-4 items-center">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="gender"
              value="male"
              checked={form.gender === "male"}
              onChange={(e) => onChange("gender", e.target.value)}
            />
            <span>Hombre</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="gender"
              value="female"
              checked={form.gender === "female"}
              onChange={(e) => onChange("gender", e.target.value)}
            />
            <span>Mujer</span>
          </label>
        </div>
      </div>

      {/* Imagen principal */}
      <div className="space-y-2">
        <label className="text-sm text-muted block">Imagen principal</label>
        {mainImagePreview ? (
          <div className="flex items-start gap-3">
            <img
              src={mainImagePreview}
              alt="principal"
              className="w-28 h-28 object-cover rounded-app border"
            />
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={clearMainImage}
                className="btn btn-ghost"
                title="Quitar imagen principal"
              >
                Quitar
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Sin imagen seleccionada</p>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e) => onChange("main_image", e.target.files?.[0])}
          className="block"
        />

        <input
          className="input"
          value={form.main_image_alt}
          onChange={(e) => onChange("main_image_alt", e.target.value)}
          placeholder="Texto alternativo (accesibilidad/SEO)"
        />

        <input
          type="number"
          min={0}
          step={1000}
          value={Math.round((form.price_cents ?? 0) / 100)}
          onChange={(e) =>
            onChange(
              "price_cents",
              Math.max(0, Number(e.target.value || 0)) * 100
            )
          }
          className="input"
          placeholder="Precio en COP (sin puntos, ej: 120000)"
        />
      </div>

      {/* Galería existente (editar) */}
      {existingImages.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm text-muted block">
            Galería (existente)
          </label>
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {existingImages.map((img, idx) => (
              <li key={img.id} className="card p-2 flex flex-col gap-2">
                <img
                  src={img.url}
                  alt={img.alt || `Imagen ${img.id}`}
                  className="w-full h-28 object-cover rounded-app border"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      id={`rm-${img.id}`}
                      type="checkbox"
                      checked={!!img.remove}
                      onChange={() => toggleRemove(img.id)}
                    />
                    <label htmlFor={`rm-${img.id}`} className="text-sm">
                      Eliminar
                    </label>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => moveImage(img.id, "up")}
                      title="Subir"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => moveImage(img.id, "down")}
                      title="Bajar"
                    >
                      ↓
                    </button>
                  </div>
                </div>
                <span className="text-xs text-muted">
                  id: {img.id} · pos: {idx}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">
            El orden mostrado se enviará como <code>images_order[]</code>. Los
            marcados se enviarán en <code>remove_image_ids[]</code>.
          </p>
        </div>
      )}

      {/* Agregar nuevas imágenes a la galería */}
      <div className="space-y-2">
        <label className="text-sm text-muted block">Agregar a galería</label>
        <input
          multiple
          type="file"
          accept="image/*"
          onChange={(e) => onChange("images", Array.from(e.target.files || []))}
          className="block"
        />
      </div>

      {/* Estado */}
      <div className="space-y-1">
        <label className="text-sm text-muted">Estado</label>
        <select
          className="select"
          value={form.status}
          onChange={(e) => onChange("status", e.target.value)}
        >
          <option value="published">Publicado</option>
          <option value="draft">Borrador</option>
          <option value="archived">Archivado</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Guardando..." : product ? "Actualizar" : "Crear"}
        </button>
        {debug && <span className="badge badge-info">debug activo</span>}
      </div>
    </form>
  );
}
