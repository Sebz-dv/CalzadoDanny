// src/components/checkout/CheckoutModal.jsx
import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { useCart } from "../../context/cart/cart-context";
import { sendCheckout } from "../../services/checkout/checkoutService";

// Pequeña ayuda para persistir el form del cliente
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
    // no pasa nada si falla el localStorage
  }
};

export default function CheckoutModal({ open, onClose }) {
  const { items, totalCOP, formatCOP, clear, showToast } = useCart();

  const [form, setForm] = useState(loadCustomer);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({}); // {field: message}
  const [step, setStep] = useState("form"); // "form" | "pay"
  const [orderCode, setOrderCode] = useState(null);
  const [boldData, setBoldData] = useState(null); // { amount, currency, signature }

  useEffect(() => {
    if (!open) {
      setErrors({});
      setLoading(false);
      setStep("form");
      setOrderCode(null);
      setBoldData(null);
      return;
    }
    // cuando abre, rehidrata por si cambió en otra pestaña
    setForm(loadCustomer());
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const next = { ...f, [name]: value };
      saveCustomer(next);
      return next;
    });
  };

  const validate = () => {
    const err = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      err.email = "Correo inválido";
    if (!/^\+?\d{7,15}$/.test(form.phone.replace(/\s+/g, "")))
      err.phone = "Celular inválido";
    if ((form.address ?? "").trim().length < 6)
      err.address = "Dirección muy corta";
    if (items.length === 0) err.items = "El carrito está vacío";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

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
        price_cents: it.price_cents ?? 0, // manejas COP “enteros”
        image: it.image ?? null,
      })),
      total_cents: totalCOP, // tu contexto ya lo calcula
    }),
    [form, items, totalCOP]
  );

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    if (!validate()) return;

    try {
      setLoading(true);
      const data = await sendCheckout(payload); // asumimos que devuelve data JSON

      if (data?.ok) {
        // Guardamos código de orden (si viene)
        setOrderCode(data.order_code ?? null);

        // Guardamos datos para el botón Bold
        setBoldData({
          amount: data.bold_amount ?? totalCOP,
          currency: data.bold_currency ?? "COP",
          signature: data.bold_signature ?? null,
        });

        showToast?.({
          title: "Pedido registrado",
          desc: "Ahora realiza el pago con Bold.",
        });

        // NO limpiamos el carrito aún; lo hacemos después si quieres
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
      className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-[1px] p-4 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl card overflow-hidden">
        <div className="card-header justify-between bg-[hsl(var(--muted))]">
          <h3 className="text-lg font-bold">Finalizar compra</h3>
          <button
            className="btn btn-ghost is-sm"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="card-body grid gap-4">
          {/* Items */}
          <div className="border rounded-lg overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="w-20">Cant.</th>
                  <th className="w-28">Precio</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i}>
                    <td className="align-top">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-md overflow-hidden surface-muted flex-shrink-0">
                          {it.image ? (
                            <img
                              src={it.image}
                              alt={it.name}
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div>
                          <div className="font-semibold">{it.name}</div>
                          <div className="text-xs text-[hsl(var(--text-muted))]">
                            {it.size ? <>Talla {it.size} • </> : null}
                            {it.color ? <>{it.color}</> : null}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{it.qty ?? 1}</td>
                    <td className="font-semibold">
                      {formatCOP(it.price_cents ?? 0)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} className="text-right font-bold">
                    Total
                  </td>
                  <td className="font-extrabold">{formatCOP(totalCOP)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {errors.items && (
            <p className="text-red-600 text-sm">{errors.items}</p>
          )}

          {step === "form" ? (
            // Paso 1: formulario de datos
            <form className="grid gap-3" onSubmit={onSubmit}>
              <div className="field">
                <label className="label">Correo electrónico</label>
                <input
                  className={`input ${errors.email ? "is-danger" : ""}`}
                  name="email"
                  type="email"
                  placeholder="tucorreo@dominio.com"
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <span className="help text-red-600">{errors.email}</span>
                )}
              </div>

              <div className="field">
                <label className="label">Celular</label>
                <input
                  className={`input ${errors.phone ? "is-danger" : ""}`}
                  name="phone"
                  type="tel"
                  placeholder="+57 3xx xxx xxxx"
                  value={form.phone}
                  onChange={handleChange}
                />
                {errors.phone && (
                  <span className="help text-red-600">{errors.phone}</span>
                )}
              </div>

              <div className="field">
                <label className="label">Dirección</label>
                <input
                  className={`input ${errors.address ? "is-danger" : ""}`}
                  name="address"
                  type="text"
                  placeholder="Calle 123 #45-67, Bogotá"
                  value={form.address}
                  onChange={handleChange}
                />
                {errors.address && (
                  <span className="help text-red-600">{errors.address}</span>
                )}
              </div>

              <div className="card-footer justify-between bg-[hsl(var(--muted))] rounded-lg">
                <span className="text-sm text-[hsl(var(--text-muted))]">
                  Te llegará confirmación al correo.
                </span>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? "Enviando…" : "Confirmar pedido"}
                </button>
              </div>
            </form>
          ) : (
            // Paso 2: botón de pagos Bold
            <div className="grid gap-3">
              <div className="p-3 rounded-lg bg-[hsl(var(--muted))] text-sm">
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

              <div className="flex justify-between items-center mt-2">
                <button
                  type="button"
                  className="btn btn-ghost is-sm"
                  onClick={() => {
                    clear(); // limpia carrito al cerrar
                    onClose();
                  }}
                >
                  Cerrar
                </button>
                <span className="text-xs text-[hsl(var(--text-muted))]">
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
 * Componente que renderiza el Botón de Pagos de Bold
 */
function BoldPaymentButton({ totalCOP, orderCode, boldData }) {
  const containerRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(false);

  // Cargar la librería global de Bold UNA sola vez
  useEffect(() => {
    if (document.querySelector('script[data-bold-lib="true"]')) {
      setScriptReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.bold.co/library/boldPaymentButton.js";
    script.async = true;
    script.setAttribute("data-bold-lib", "true");

    script.onload = () => setScriptReady(true);
    script.onerror = () => {
      console.error("No se pudo cargar el script de Bold");
      setScriptReady(false);
    };

    document.body.appendChild(script);
  }, []);

  // Crear el <script data-bold-button ...> dinámicamente con amount y orderCode
  useEffect(() => {
    if (!scriptReady || !containerRef.current) return;
    if (!boldData) return;

    // Limpia cualquier instancia anterior
    containerRef.current.innerHTML = "";

    const scriptTag = document.createElement("script");

    // Estilos del botón: dark-L, dark-M, light-S, etc.
    scriptTag.setAttribute("data-bold-button", "dark-L");

    const safeOrderId = orderCode || `ORD-${Date.now()}`;

    scriptTag.setAttribute("data-order-id", safeOrderId);
    scriptTag.setAttribute(
      "data-currency",
      boldData.currency || "COP"
    );
    scriptTag.setAttribute(
      "data-amount",
      String(boldData.amount ?? totalCOP)
    );

    // ⚠️ Usa aquí TU API KEY PÚBLICA (la de identidad, NO la secreta)
    scriptTag.setAttribute(
      "data-api-key",
      import.meta.env.VITE_BOLD_API_KEY || "TU_API_KEY_PUBLICA_DE_BOLD_AQUI"
    );

    // Hash de integridad generado en el backend (obligatorio cuando hay amount)
    if (boldData.signature) {
      scriptTag.setAttribute(
        "data-integrity-signature",
        boldData.signature
      );
    }

    // 🔥 IMPORTANTE: NO poner redirection-url en localhost
    // Bold se queja de "http://localhost:5173/..." como inválido
    if (window.location.protocol === "https:") {
      const redirectionUrl =
        window.location.origin + "/checkout/resultado";

      scriptTag.setAttribute("data-redirection-url", redirectionUrl);
    }
    // En local (http://localhost:5173) no seteamos nada y Bold usa la URL padre

    // Descripción (2–100 caracteres, sin URL)
    const desc = orderCode
      ? `Compra Calzado Danny #${orderCode}`
      : "Compra Calzado Danny";

    scriptTag.setAttribute("data-description", desc);

    // Impuesto (si aplica)
    scriptTag.setAttribute("data-tax", "vat-19");

    // Log para ver qué exactamente se le pasa a Bold
    console.log("BoldPaymentButton config:", {
      "data-order-id": safeOrderId,
      "data-currency": boldData.currency || "COP",
      "data-amount": String(boldData.amount ?? totalCOP),
      "data-api-key":
        import.meta.env.VITE_BOLD_API_KEY || "TU_API_KEY_PUBLICA_DE_BOLD_AQUI",
      "data-integrity-signature": boldData.signature,
      "data-redirection-url":
        window.location.protocol === "https:"
          ? window.location.origin + "/checkout/resultado"
          : "(no enviada en http)",
      "data-description": desc,
      "data-tax": "vat-19",
    });

    containerRef.current.appendChild(scriptTag);
  }, [scriptReady, boldData, orderCode, totalCOP]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={containerRef} />
      <p className="text-xs text-[hsl(var(--text-muted))] text-center mt-2">
        Serás dirigido a Bold para completar el pago de forma segura.
      </p>
    </div>
  );
}
