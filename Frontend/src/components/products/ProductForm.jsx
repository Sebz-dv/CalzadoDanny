// ProductForm.jsx — crear/editar con galería y orden
import React, { useEffect, useMemo, useState } from "react";
import {
  createProduct,
  updateProduct,
} from "../../services/products/productsService";
import { listCategories } from "../../services/categories/categoriesService";
import MainImageField from "../buttons/MainImageField";

const GENDER_MAP = {
  male: "male",
  female: "female",
  hombre: "male",
  mujer: "female",
};

const MAX_PRICE = 999_999_999; // límite aprox: 999M COP

export default function ProductForm({ product, onSaved, debug = false }) {
  const [form, setForm] = useState({
    category_id: "",
    name: "",
    referencia: "",
    slug: "",
    description: "",
    size: "",
    color: "",
    gender: "male",
    status: "published",

    // imagen principal
    main_image: undefined, // File | null | undefined
    main_image_alt: "",
    main_image_url: "", // para edición (preview existente)

    // galería nueva
    images: [], // File[]
    images_alt: [],

    // admin galería existente
    remove_image_ids: [],
    images_order: [],

    // precio (cents)
    price_cents: null,
  });

  const [cats, setCats] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // [{id,url,alt,position,remove:false}]
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // ====== helpers ======
  const onChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const onChangeNumber = (k, v) => {
    const n = v === "" ? "" : Number(v);
    onChange(k, Number.isNaN(n) ? "" : n);
  };

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
      return;
    }

    setForm((f) => ({
      ...f,
      category_id: product.category_id ?? "",
      name: product.name ?? "",
      referencia: product.referencia ?? "",
      slug: product.slug ?? "",
      description: product.description ?? "",
      size: product.size ?? "",
      color: product.color ?? "",
      gender: product.gender ?? "male",
      status: product.status ?? "published",

      // principal: no precargamos File, solo url/alt para preview
      main_image: undefined,
      main_image_alt: product.main_image_alt ?? "",
      main_image_url: product.main_image_url ?? "",

      // reset de inputs de galería nueva
      images: [],
      images_alt: [],

      // admin
      remove_image_ids: [],
      images_order: (product.images || []).map((img) => img.id),

      // precio
      price_cents: product.price_cents ?? null,
    }));

    // ordenar galería existente
    const sorted = [...(product.images || [])].sort((a, b) => {
      const pa = Number(a.position ?? 0);
      const pb = Number(b.position ?? 0);
      return pa === pb ? a.id - b.id : pa - pb;
    });
    setExistingImages(sorted.map((i) => ({ ...i, remove: false })));
  }, [product]);

  // marcar/desmarcar para remover imagen existente
  const toggleRemove = (id) => {
    setExistingImages((imgs) =>
      imgs.map((it) => (it.id === id ? { ...it, remove: !it.remove } : it))
    );
  };

  // mover ↑/↓ en UI (luego mandamos order)
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
        referencia: form.referencia?.trim() || "",
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
    onChange("main_image", null);
    onChange("main_image_url", "");
  };

  // chips para color
  const colorChips = useMemo(() => {
    return (form.color || "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
  }, [form.color]);

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">
            {product ? "Editar producto" : "Crear producto"}
          </h2>
          <p className="text-sm help">
            Completa la información básica, imágenes y precio.
          </p>
        </div>
        {debug && (
          <span className="badge bg-[hsl(var(--warning)/0.15)] border-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]">
            Debug activo
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-[hsl(var(--destructive))] bg-[hsl(var(--destructive)/0.12)] px-4 py-3 text-sm text-[hsl(var(--destructive-foreground))] flex items-start gap-2">
          <span className="mt-0.5">⚠️</span>
          <div>
            <div className="font-semibold">Error al guardar</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Sección: Información básica */}
      <section className="card p-4 md:p-6 space-y-4 border border-neutral-400 dark:border-neutral-300">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
            Información básica
          </h3>
          <span className="text-xs help">
            Campos obligatorios marcados con *
          </span>
        </div>

        {/* Categoría */}
        <div className="field">
          <label className="label">Categoría *</label>
          <select
            value={form.category_id}
            onChange={(e) => onChangeNumber("category_id", e.target.value)}
            required
            className="select w-full border border-neutral-400 dark:border-neutral-300"
          >
            <option value="">Selecciona una categoría…</option>
            {(cats?.data ?? cats)?.map?.((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Nombre / Referencia / Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div className="field">
            <label className="label">Nombre *</label>
            <input
              className="input w-full border border-neutral-400 dark:border-neutral-300"
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="Ej: Tenis urbano unisex"
              required
            />
          </div>

          {/* Referencia */}
          <div className="field">
            <label className="label">Referencia *</label>
            <input
              className="input w-full border border-neutral-400 dark:border-neutral-300"
              value={form.referencia}
              onChange={(e) => onChange("referencia", e.target.value)}
              placeholder="Ej: REF-1234, 5010, COD-ABC…"
              required
            />
          </div>

          {/* Slug */}
          <div className="field md:col-span-2">
            <label className="label flex items-center justify-between">
              <span>Slug</span>
              <span className="text-[0.7rem] help">Opcional</span>
            </label>
            <input
              className="input w-full border border-neutral-400 dark:border-neutral-300"
              value={form.slug}
              onChange={(e) => onChange("slug", e.target.value)}
              placeholder="tenis-urbano-unisex"
            />
          </div>
        </div>

        {/* Descripción */}
        <div className="field">
          <label className="label">Descripción</label>
          <textarea
            className="textarea w-full border border-neutral-400 dark:border-neutral-300"
            rows={3}
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Detalles del producto, materiales, usos recomendados…"
          />
          <p className="help">
            Esta descripción se mostrará en la ficha del producto.
          </p>
        </div>

        {/* Talla / Color */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="field">
            <label className="label">Talla</label>
            <input
              className="input w-full border border-neutral-400 dark:border-neutral-300"
              value={form.size}
              onChange={(e) => onChange("size", e.target.value)}
              placeholder="Ej: 36, 37, M, L…"
            />
          </div>

          <div className="field">
            <label className="label">Color(es)</label>
            <textarea
              className="textarea w-full min-h-[80px] resize-y border border-neutral-400 dark:border-neutral-300"
              value={form.color}
              onChange={(e) => onChange("color", e.target.value)}
              placeholder="Ej: Negro, blanco, amarillo, naranja, dorado, verde, café…"
            />
            <p className="help">
              Escribe uno o varios colores separados por coma. El campo admite
              textos largos.
            </p>

            {colorChips.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {colorChips.map((c, idx) => (
                  <span
                    key={`${c}-${idx}`}
                    className="inline-flex items-center rounded-full border border-neutral-400 dark:border-neutral-300 bg-[hsl(var(--muted)/0.8)] px-2.5 py-0.5 text-xs text-[hsl(var(--fg))]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Género y Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Género */}
          <div className="field">
            <label className="label">Género</label>
            <div className="flex gap-4 items-center mt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={form.gender === "male"}
                  onChange={(e) => onChange("gender", e.target.value)}
                />
                <span className="text-sm">Hombre</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={form.gender === "female"}
                  onChange={(e) => onChange("gender", e.target.value)}
                />
                <span className="text-sm">Mujer</span>
              </label>
            </div>
          </div>

          {/* Estado */}
          <div className="field">
            <label className="label">Estado</label>
            <select
              className="select w-full border border-neutral-400 dark:border-neutral-300"
              value={form.status}
              onChange={(e) => onChange("status", e.target.value)}
            >
              <option value="published">Publicado</option>
              <option value="draft">Borrador</option>
              <option value="archived">Archivado</option>
            </select>
            <p className="help">
              Controla si el producto es visible en la tienda.
            </p>
          </div>
        </div>
      </section>

      {/* Sección: Imágenes */}
      <section className="card p-4 md:p-6 space-y-4 border border-neutral-400 dark:border-neutral-300">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
          Imágenes
        </h3>

        {/* Imagen principal */}
        <div className="space-y-2">
          <MainImageField
            label="Imagen principal"
            valueFile={form.main_image}
            valueAlt={form.main_image_alt}
            existingUrl={form.main_image_url}
            onChangeFile={(file) => onChange("main_image", file)}
            onChangeAlt={(txt) => onChange("main_image_alt", txt)}
            help="JPG, PNG o WEBP. Tamaño recomendado: 1200×1200."
          />

          {(form.main_image || form.main_image_url) && (
            <div className="mt-1">
              <button
                type="button"
                className="btn btn-ghost is-sm"
                onClick={clearMainImage}
              >
                Quitar imagen principal
              </button>
            </div>
          )}
        </div>

        {/* Galería existente */}
        {existingImages.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="label">Galería existente</span>
              <span className="text-xs help">
                Reordena y marca para eliminar
              </span>
            </div>
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {existingImages.map((img, idx) => (
                <li
                  key={img.id}
                  className={`flex flex-col gap-2 rounded-lg bg-[hsl(var(--card))] p-2 border border-neutral-400 dark:border-neutral-300 ${
                    img.remove
                      ? "opacity-60 ring-1 ring-[hsl(var(--destructive))]"
                      : ""
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.alt || `Imagen ${img.id}`}
                    className="w-full h-28 object-cover rounded-md border border-neutral-400 dark:border-neutral-300"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        id={`rm-${img.id}`}
                        type="checkbox"
                        checked={!!img.remove}
                        onChange={() => toggleRemove(img.id)}
                      />
                      <span>Eliminar</span>
                    </label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="btn btn-ghost is-sm"
                        onClick={() => moveImage(img.id, "up")}
                        title="Subir"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost is-sm"
                        onClick={() => moveImage(img.id, "down")}
                        title="Bajar"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                  <span className="text-[11px] help">
                    id: {img.id} · orden: {idx + 1}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs help">
              El orden mostrado se enviará como{" "}
              <code className="font-mono">images_order[]</code>. Los marcados se
              enviarán en <code className="font-mono">remove_image_ids[]</code>.
            </p>
          </div>
        )}

        {/* Agregar nuevas imágenes */}
        <div className="field">
          <label className="label">Agregar a galería</label>

          <label className="panel flex cursor-pointer items-center justify-between gap-3 border-2 border-dashed border-neutral-400 dark:border-neutral-300 bg-[hsl(var(--muted)/0.8)] px-4 py-3 hover:bg-[hsl(var(--muted))] transition-colors">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-[hsl(var(--bg))] border border-neutral-400 dark:border-neutral-300">
                🖼️
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">
                  Subir imágenes adicionales
                </div>
                <div className="text-xs help">
                  Arrastra y suelta o haz clic (múltiples archivos)
                </div>
              </div>
            </div>
            <span className="btn btn-secondary is-sm">Seleccionar</span>
            <input
              multiple
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) =>
                onChange("images", Array.from(e.target.files || []))
              }
            />
          </label>
        </div>
      </section>

      {/* Sección: Precio */}
      <section className="card p-4 md:p-6 space-y-4 border border-neutral-400 dark:border-neutral-300">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
          Precio
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-4 items-end">
          <div className="field">
            <label className="label">Valor (COP)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={form.price_cents ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  onChange("price_cents", null);
                  return;
                }
                let num = Number(v);
                if (Number.isNaN(num)) return;
                if (num < 0) num = 0;
                if (num > MAX_PRICE) num = MAX_PRICE;
                onChange("price_cents", num);
              }}
              className="input w-full border border-neutral-400 dark:border-neutral-300"
              placeholder="0"
            />

            <p className="help">
              Límite aprox:{" "}
              {new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                maximumFractionDigits: 0,
              }).format(MAX_PRICE)}
              . Escribe el valor completo en pesos (sin puntos ni comas).
            </p>
          </div>
          <div className="text-right md:text-base text-sm">
            <div className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] mb-1">
              Vista previa
            </div>
            <div className="font-semibold">
              {form.price_cents
                ? new Intl.NumberFormat("es-CO", {
                    style: "currency",
                    currency: "COP",
                    maximumFractionDigits: 0,
                  }).format(form.price_cents)
                : "—"}
            </div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary min-w-[120px]"
        >
          {loading ? "Guardando..." : product ? "Actualizar" : "Crear"}
        </button>
      </div>
    </form>
  );
}
