// src/components/checkout/CheckoutModal.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useCart } from "../../context/cart/cart-context";
import { sendCheckout } from "../../services/checkout/checkoutService";

// Clave para persistir datos del cliente en localStorage
const FORM_KEY = "checkout:customer";

const loadCustomer = () => {
  try {
    return (
      JSON.parse(localStorage.getItem(FORM_KEY)) ?? {
        email: "",
        phone: "",
        address: "",
      }
    );
  } catch {
    return { email: "", phone: "", address: "" };
  }
};

const saveCustomer = (data) => {
  try {
    localStorage.setItem(FORM_KEY, JSON.stringify(data));
  } catch {
    // si falla localStorage, no pasa nada
  }
};

export default function CheckoutModal({ open, onClose }) {
  const { items, totalCOP, formatCOP, showToast } = useCart();

  const [form, setForm] = useState(loadCustomer);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({}); // { field: message }
  const [step, setStep] = useState("form"); // "form" | "pay"
  const [orderCode, setOrderCode] = useState(null);
  const [boldData, setBoldData] = useState(null); // { amount, currency, signature }

  // Reset del modal cuando se cierra / reabre
  useEffect(() => {
    if (!open) {
      setErrors({});
      setLoading(false);
      setStep("form");
      setOrderCode(null);
      setBoldData(null);
      return;
    }
    setForm(loadCustomer());
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      saveCustomer(next);
      return next;
    });
  };

  const validate = () => {
    const err = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      err.email = "Correo inválido";
    }

    if (!/^\+?\d{7,15}$/.test(form.phone.replace(/\s+/g, ""))) {
      err.phone = "Celular inválido";
    }

    if ((form.address ?? "").trim().length < 6) {
      err.address = "Dirección muy corta";
    }

    if (items.length === 0) {
      err.items = "El carrito está vacío";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // Payload que se envía al backend
  const payload = useMemo(
    () => ({
      customer: {
        email: form.email,
        phone: form.phone,
        address: form.address,
      },
      items: items.map((it) => ({
        product_id: it.product_id ?? it.id,
        name: it.name,
        size: it.size ?? null,
        color: it.color ?? null,
        qty: it.qty ?? 1,
        // manejas COP como enteros (sin decimales)
        price_cents: it.price_cents ?? 0,
        image: it.image ?? null,
      })),
      total_cents: totalCOP,
    }),
    [form, items, totalCOP]
  );

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    if (!validate()) return;

    try {
      setLoading(true);
      const data = await sendCheckout(payload);

      if (data?.ok) {
        setOrderCode(data.order_code ?? null);

        setBoldData({
          amount: data.bold_amount ?? totalCOP,
          currency: data.bold_currency ?? "COP",
          signature: data.bold_signature ?? null,
        });

        showToast?.({
          title: "Pedido registrado",
          desc: "Ahora realiza el pago con Bold.",
        });

        setStep("pay");
      } else {
        showToast?.({
          title: "No pudimos registrar el pedido",
          desc: data?.message ?? "Intenta de nuevo en unos minutos.",
        });
      }
    } catch (err) {
      const resp = err?.response?.data;
      if (resp?.errors) {
        const flat = {};
        Object.entries(resp.errors).forEach(([k, v]) => {
          flat[k] = v?.[0] ?? "Valor inválido";
        });
        setErrors(flat);
      } else if (resp?.message) {
        showToast?.({ title: "No pudimos procesar", desc: resp.message });
      } else {
        showToast?.({
          title: "Error al comprar",
          desc: "Intenta de nuevo en unos minutos.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-[1px] px-2 py-4 sm:p-4 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl card overflow-hidden max-h-[90vh] flex flex-col">
        <div className="card-header justify-between bg-[hsl(var(--muted))]">
          <h3 className="text-base sm:text-lg font-bold">Finalizar compra</h3>
          <button
            className="btn btn-ghost is-sm"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="card-body grid gap-4 overflow-y-auto">
          {/* Items del carrito */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table min-w-full text-xs sm:text-sm">
                <thead>
                  <tr>
                    <th className="whitespace-nowrap">Producto</th>
                    <th className="w-16 sm:w-20 text-center">Cant.</th>
                    <th className="w-24 sm:w-28 text-right">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i}>
                      <td className="align-top">
                        <div className="flex gap-2 sm:gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden surface-muted flex-shrink-0">
                            {it.image ? (
                              <img
                                src={it.image}
                                alt={it.name}
                                className="w-full h-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div>
                            <div className="font-semibold text-xs sm:text-sm">
                              {it.name}
                            </div>
                            <div className="text-[10px] sm:text-xs text-[hsl(var(--text-muted))]">
                              {it.size ? <>Talla {it.size} • </> : null}
                              {it.color ? <>{it.color}</> : null}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center align-middle">
                        {it.qty ?? 1}
                      </td>
                      <td className="font-semibold text-right align-middle">
                        {formatCOP(it.price_cents ?? 0)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td
                      colSpan={2}
                      className="text-right font-bold text-xs sm:text-sm"
                    >
                      Total
                    </td>
                    <td className="font-extrabold text-right">
                      {formatCOP(totalCOP)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {errors.items && (
            <p className="text-red-600 text-xs sm:text-sm">{errors.items}</p>
          )}

          {step === "form" ? (
            // Paso 1: datos del cliente
            <form className="grid gap-3" onSubmit={onSubmit}>
              <div className="field">
                <label className="label text-sm">Correo electrónico</label>
                <input
                  className={`input ${errors.email ? "is-danger" : ""}`}
                  name="email"
                  type="email"
                  placeholder="tucorreo@dominio.com"
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <span className="help text-red-600 text-xs">
                    {errors.email}
                  </span>
                )}
              </div>

              <div className="field">
                <label className="label text-sm">Celular</label>
                <input
                  className={`input ${errors.phone ? "is-danger" : ""}`}
                  name="phone"
                  type="tel"
                  placeholder="+57 3xx xxx xxxx"
                  value={form.phone}
                  onChange={handleChange}
                />
                {errors.phone && (
                  <span className="help text-red-600 text-xs">
                    {errors.phone}
                  </span>
                )}
              </div>

              <div className="field">
                <label className="label text-sm">Dirección</label>
                <input
                  className={`input ${errors.address ? "is-danger" : ""}`}
                  name="address"
                  type="text"
                  placeholder="Calle 123 #45-67, Bogotá"
                  value={form.address}
                  onChange={handleChange}
                />
                {errors.address && (
                  <span className="help text-red-600 text-xs">
                    {errors.address}
                  </span>
                )}
              </div>

              <div className="card-footer bg-[hsl(var(--muted))] rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-xs sm:text-sm text-[hsl(var(--text-muted))]">
                  Te llegará confirmación al correo.
                </span>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full sm:w-auto"
                >
                  {loading ? "Enviando…" : "Confirmar pedido"}
                </button>
              </div>
            </form>
          ) : (
            // Paso 2: Botón Bold (embedded)
            <div className="grid gap-3">
              <div className="p-3 rounded-lg bg-[hsl(var(--muted))] text-xs sm:text-sm">
                <p>
                  Tu pedido{" "}
                  {orderCode ? (
                    <strong>#{orderCode}</strong>
                  ) : (
                    <strong>registrado</strong>
                  )}{" "}
                  fue creado correctamente.
                </p>
                <p className="mt-1">
                  Ahora realiza el pago a través de la pasarela segura de Bold:
                </p>
              </div>

              <BoldPaymentButton
                totalCOP={totalCOP}
                orderCode={orderCode}
                boldData={boldData}
              />

              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mt-2 gap-2">
                <button
                  type="button"
                  className="btn btn-ghost is-sm w-full sm:w-auto"
                  onClick={() => {
                    // Solo cerramos el modal, no limpiamos el carrito aquí.
                    onClose();
                  }}
                >
                  Cerrar
                </button>
                <span className="text-[10px] sm:text-xs text-[hsl(var(--text-muted))] text-center sm:text-right">
                  Si el pago no se completa, tu pedido quedará pendiente de
                  confirmación.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Componente que renderiza el Botón de Pagos de Bold (Embedded Checkout)
 */
function BoldPaymentButton({ totalCOP, orderCode, boldData }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!boldData) return;

    // Limpia cualquier instancia previa del botón
    containerRef.current.innerHTML = "";

    const scriptTag = document.createElement("script");

    // Librería + config del botón en el mismo script
    scriptTag.src = "https://checkout.bold.co/library/boldPaymentButton.js";
    scriptTag.async = true;

    // Estilo del botón (dark-L, dark-M, light-S, etc.)
    scriptTag.setAttribute("data-bold-button", "dark-L");

    // Modo embebido: abre la pasarela en un modal dentro de tu página
    scriptTag.setAttribute("data-render-mode", "embedded");

    const safeOrderId = orderCode || `ORD-${Date.now()}`;

    scriptTag.setAttribute("data-order-id", safeOrderId);
    scriptTag.setAttribute("data-currency", boldData.currency || "COP");
    scriptTag.setAttribute("data-amount", String(boldData.amount ?? totalCOP));

    const apiKey = import.meta.env.VITE_BOLD_API_KEY;
    if (!apiKey) {
      console.error(
        "[BoldPaymentButton] Falta VITE_BOLD_API_KEY en el .env del frontend"
      );
    }
    scriptTag.setAttribute(
      "data-api-key",
      apiKey || "TU_API_KEY_PUBLICA_DE_BOLD_AQUI"
    );

    // Hash de integridad generado en el backend
    if (boldData.signature) {
      scriptTag.setAttribute("data-integrity-signature", boldData.signature);
    }

    // 🔥 Redirigir a la MISMA página con un flag para saber que viene de Bold
    const url = new URL(window.location.href);
    url.searchParams.set("bold_return", "1");
    scriptTag.setAttribute("data-redirection-url", url.toString());

    const desc = orderCode
      ? `Compra Calzado Danny #${orderCode}`
      : "Compra Calzado Danny";
    scriptTag.setAttribute("data-description", desc);

    // Impuesto (si aplica)
    scriptTag.setAttribute("data-tax", "vat-19");

    containerRef.current.appendChild(scriptTag);
  }, [boldData, orderCode, totalCOP]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={containerRef} />
      <p className="text-[10px] sm:text-xs text-[hsl(var(--text-muted))] text-center mt-2">
        El pago se abrirá en un modal seguro de Bold, sin salir de esta página.
      </p>
    </div>
  );
}
