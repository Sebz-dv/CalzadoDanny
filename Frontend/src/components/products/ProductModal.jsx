// src/pages/admin/ProductModal.jsx
import React, { useEffect } from "react";
import ProductForm from "./ProductForm"; // importa el que ya tienes

export default function ProductModal({ product, onClose, onSaved }) {
  // cerrar con ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const title = product ? "Editar producto" : "Crear producto"; 

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* modal */}
      <div className="relative card w-full max-w-3xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="btn btn-ghost">Cerrar</button>
        </div>
        <div className="max-h-[80vh] overflow-auto pr-1">
          <ProductForm product={product} onSaved={onSaved} />
        </div>
      </div>
    </div>
  );
}
