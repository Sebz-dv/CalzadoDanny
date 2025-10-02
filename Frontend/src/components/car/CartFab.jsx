import React from "react";
import { useCart } from "../../context/cart/cart-context";

export default function CartFab() {
  const { count, total_cents, formatCOP, openCart } = useCart();
  return (
    <button
      onClick={openCart}
      className="fixed bottom-4 right-4 z-[250] px-4 py-3 rounded-full shadow-strong border border-[#d8c2aa] bg-card text-[#191410] hover:shadow-xl transition"
      aria-label="Abrir carrito"
    >
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-[#3B82F6] text-white flex items-center justify-center text-xs font-bold">
          {count}
        </span>
        <span className="text-sm font-semibold">{formatCOP(total_cents)}</span>
      </div>
    </button>
  );
}
