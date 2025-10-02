import React from "react";

export default function Loader({ show = true, fullscreen = false, label = "Cargando…" }) {
  if (!show) return null;
  return (
    <div className={fullscreen ? "fixed inset-0 z-50 grid place-items-center bg-black/10 backdrop-blur-sm" : ""}>
      <div className="flex items-center gap-3 rounded-xl border bg-white/80 px-4 py-3 shadow-md">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}
