// src/components/car/CartButton.jsx
import React from "react";
import { FiShoppingCart } from "react-icons/fi";

export default function CartButton({ onClick, count = 0, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-2 px-3 py-2 rounded-full border border-[#AC9484] bg-[#FAEAD7] text-[#191410] hover:bg-white/90 transition ${className}`}
      aria-label="Abrir carrito"
    >
      <FiShoppingCart className="text-lg" />
      <span className="text-sm font-semibold">Carrito</span>

      {count > 0 && ( // ✅ solo si hay items
        <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-[#d87b3e] text-white text-[10px] font-bold flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  );
}
