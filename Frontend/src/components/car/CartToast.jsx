import React, { useEffect } from "react";
import { useCart } from "../../context/cart/cart-context";
import { FiCheckCircle } from "react-icons/fi";

export default function CartToast() {
  const { toast, clearToast } = useCart();

  useEffect(() => {
    // ya se auto-cierra desde el contexto; esto es por si quieres cerrar al Escape
    const onKey = (e) => e.key === "Escape" && clearToast();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearToast]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] animate-[fadeIn_.2s_ease]">
      <div className="flex items-start gap-3 p-4 rounded-2xl shadow-2xl border border-[#d8c2aa] bg-[#FAEAD7] text-[#191410] min-w-[260px]">
        <div className="w-7 h-7 rounded-full bg-[#d87b3e] text-white flex items-center justify-center shrink-0">
          <FiCheckCircle />
        </div>
        <div className="flex-1">
          <div className="font-semibold">{toast.title}</div>
          {toast.desc ? <div className="text-xs text-[#48331E]">{toast.desc}</div> : null}
        </div>
        <button
          onClick={clearToast}
          className="text-xs px-2 py-1 rounded-xl border border-[#d8c2aa] hover:bg-white/70"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
