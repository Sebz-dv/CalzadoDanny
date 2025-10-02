// src/components/car/CartModal.jsx
import React, { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "../../context/cart/cart-context";
import CheckoutModal from "../checkout/CheckoutModal"; // 👈 nuevo

export default function CartModal() {
  const {
    isOpen,
    closeCart,
    items = [],
    removeItem,
    totalCOP = 0,
    formatCOP = (n) => n,
    clear,
  } = useCart();

  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Cerrar con ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  const onBackdropClick = useCallback(
    (e) => {
      if (e.currentTarget === e.target) closeCart();
    },
    [closeCart]
  );

  if (!isOpen) return (
    <>
      {/* El checkout puede abrirse aunque el carrito esté cerrado */}
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  );

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-[1px] p-4 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        onClick={onBackdropClick}
      >
        <div
          className="w-full max-w-3xl card overflow-hidden animate-[fadeIn_.15s_ease]"
          role="document"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="card-header justify-between bg-[hsl(var(--muted))]">
            <h2 id="cart-title" className="text-xl font-extrabold">
              Tu carrito
            </h2>
            <button className="btn btn-ghost is-sm" onClick={closeCart} aria-label="Cerrar">
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[70vh] overflow-auto divide-y">
            {items.length === 0 ? (
              <div className="p-6 text-center text-[hsl(var(--text-muted))]">
                Aún no tienes productos.
              </div>
            ) : (
              items.map((it, idx) => {
                const key = [
                  it.product_id ?? it.id,
                  it.size ?? "",
                  (it.color ?? "").toLowerCase(),
                ].join("|");

                return (
                  <div key={key || idx} className="px-4 py-3 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-md overflow-hidden surface-muted flex-shrink-0">
                      {it.image ? (
                        <img
                          src={it.image}
                          alt={it.name}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{it.name}</div>
                      <div className="text-xs text-[hsl(var(--text-muted))]">
                        {it.size ? (
                          <>
                            Talla: <span className="font-medium">{it.size}</span> •{" "}
                          </>
                        ) : null}
                        {it.color ? (
                          <>
                            Color:{" "}
                            <span className="font-medium capitalize">{it.color}</span>
                          </>
                        ) : null}
                      </div>
                      <div className="text-xs text-[hsl(var(--text-muted))]">
                        Precio:{" "}
                        <span className="font-semibold">
                          {/** ✅ NO dividimos /100: tu formatCOP espera COP “enteros” */}
                          {formatCOP(it.price_cents ?? 0)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="btn btn-ghost is-sm" onClick={() => removeItem(key)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="card-footer justify-between bg-[hsl(var(--muted))]">
            <div className="text-sm text-[hsl(var(--text-muted))]">
              Subtotal: <span className="font-semibold">{formatCOP(totalCOP)}</span>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-ghost" onClick={clear}>
                Vaciar
              </button>
              <button className="btn btn-secondary" onClick={closeCart}>
                Seguir comprando
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  // Cerramos el carrito y abrimos el checkout
                  closeCart();
                  setCheckoutOpen(true);
                }}
              >
                Finalizar compra
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout modal arriba del overlay del carrito */}
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>,
    document.body
  );
}
