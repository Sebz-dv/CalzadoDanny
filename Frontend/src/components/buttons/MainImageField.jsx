// src/components/form/MainImageField.jsx
import React, { useState, useEffect } from "react";

export default function MainImageField({
  label = "Imagen principal",
  valueFile,              // File | null
  valueAlt = "",          // string
  existingUrl = "",       // url ya guardada (backend)
  onChangeFile,           // (file|null) => void
  onChangeAlt,            // (string) => void
  help = "Formatos: JPG, PNG o WEBP.",
}) {
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (valueFile) {
      const url = URL.createObjectURL(valueFile);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview("");
  }, [valueFile]);

  const handleFile = (file) => onChangeFile?.(file ?? null);

  return (
    <div className="grid gap-4">
      {/* Campo archivo con dropzone simple */}
      <div className="field">
        <label htmlFor="main_image__input" className="label">{label}</label>

        <div className="panel p-3">
          <label
            htmlFor="main_image__input"
            className="flex cursor-pointer items-center justify-between gap-3 rounded border-2 border-dashed border-subtle bg-[hsl(var(--muted))/0.5] px-3 py-3 hover:bg-[hsl(var(--muted))/0.8] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded bg-[hsl(var(--bg))] border">📷</div>
              <div className="leading-tight">
                <div className="font-semibold">Subir imagen</div>
                <div className="help">Arrastra y suelta o <span className="underline">haz clic</span></div>
              </div>
            </div>
            <button type="button" className="btn btn-secondary is-sm">Seleccionar</button>
          </label>

          <input
            id="main_image__input"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />

          {(valueFile?.name || preview || existingUrl) && (
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="truncate text-sm text-muted">
                {valueFile?.name ?? "Imagen seleccionada"}
              </div>
              <button type="button" className="btn btn-ghost is-sm" onClick={() => handleFile(null)}>
                Quitar
              </button>
            </div>
          )}

          {(preview || existingUrl) && (
            <div className="mt-3 rounded border border-subtle bg-[hsl(var(--muted))] p-2">
              <img
                src={preview || existingUrl}
                alt={valueAlt || "Vista previa"}
                className="mx-auto h-28 w-auto object-contain rounded shadow-soft"
                draggable="false"
                onError={(e) => {
                  e.currentTarget.style.objectFit = "contain";
                  e.currentTarget.src =
                    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='96'><rect width='100%' height='100%' fill='%23eee'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-family='Arial' font-size='12'>sin imagen</text></svg>";
                }}
              />
            </div>
          )}
        </div>

        {help && <div className="help mt-2">{help}</div>}
      </div>

      {/* Alt text */}
      <div className="field">
        <label className="label">Texto alternativo</label>
        <input
          className="input"
          value={valueAlt ?? ""}
          onChange={(e) => onChangeAlt?.(e.target.value)}
          placeholder="Texto alternativo (accesibilidad/SEO)"
        />
        <div className="help">Describe la imagen; mejora accesibilidad y SEO.</div>
      </div>
    </div>
  );
}
