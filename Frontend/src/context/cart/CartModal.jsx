import React, { useEffect, useMemo, useState } from "react";
import { useCart } from "./cart-context";

const LS_KEY = "checkout_form_v1";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  method: "domicilio", // "domicilio" | "retiro"
  address: "",
  city: "",
  notes: "",
  acceptTerms: false,
};

function loadForm() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? { ...initialForm, ...JSON.parse(raw) } : initialForm;
  } catch {
    return initialForm;
  }
}
function saveForm(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {
    // noop
  }
}

async function sendOrder(order) {
  const base = import.meta.env.VITE_API_URL;
  if (!base) throw new Error("Falta VITE_API_URL (frontend) para enviar el pedido.");
  const res = await fetch(`${base}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error ${res.status} enviando pedido`);
  }
  return res.json();
}

export default function CartModal() {
  const {
    open,
    items,
    formatCOP,
    closeCart,
    incQty,
    decQty,
    changeQty,
    removeItem,
    clearCart,
  } = useCart();

  const [step, setStep] = useState(0); // 0 = Carrito, 1 = Datos
  const [form, setForm] = useState(loadForm());
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && closeCart();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeCart]);

  useEffect(() => { saveForm(form); }, [form]);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setErrors({});
      setSubmitting(false);
      setErrorMsg("");
    }
  }, [open]);

  // ⚠️ No retornes antes de los hooks/calculos
  const safeItems = Array.isArray(items) ? items : [];
  const subtotal = useMemo(
    () =>
      safeItems.reduce((sum, i) => {
        const qty = Math.max(1, parseInt(i?.qty ?? 1, 10) || 1);
        const price = parseInt(i?.unitPriceCOP ?? 0, 10) || 0;
        return sum + qty * price;
      }, 0),
    [safeItems]
  );
  const shipping = form.method === "domicilio" && safeItems.length ? 12000 : 0;
  const total = subtotal + shipping;

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    const err = {};
    if (!form.fullName.trim()) err.fullName = "Nombre requerido";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = "Email inválido";
    if (!/^[0-9\s()+-]{7,}$/.test(form.phone)) err.phone = "Teléfono inválido";
    if (form.method === "domicilio") {
      if (!form.address.trim()) err.address = "Dirección requerida";
      if (!form.city.trim()) err.city = "Ciudad requerida";
    }
    if (!form.acceptTerms) err.acceptTerms = "Debes aceptar términos";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      const order = {
        id: `ORD-${Date.now()}`,
        createdAt: new Date().toISOString(),
        customer: {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        },
        delivery: {
          method: form.method,
          address: form.method === "domicilio" ? form.address.trim() : null,
          city: form.method === "domicilio" ? form.city.trim() : null,
          notes: form.notes.trim() || null,
          shippingCOP: shipping,
        },
        cart: {
          items: safeItems.map((it) => ({
            key: it.key,
            ref: it.ref,
            name: it.name,
            qty: Math.max(1, parseInt(it?.qty ?? 1, 10) || 1),
            unitPriceCOP: parseInt(it?.unitPriceCOP ?? 0, 10) || 0,
            size: it.size || null,
            color: it.color || null,
            category: it.category || null,
            gender: it.gender || null,
          })),
          subtotalCOP: subtotal,
          totalCOP: total,
        },
      };

      await sendOrder(order); // ← SOLO correo, sin descargas
      alert("¡Pedido enviado! Recibirás confirmación por correo.");
      clearCart();
      setForm(initialForm);
      saveForm(initialForm);
      closeCart();
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err?.message ||
          "No fue posible enviar el pedido. Revisa tu conexión o intenta de nuevo."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
      onClick={closeCart}
      aria-label="Cerrar carrito"
    >
      <div
        className="w-full max-w-3xl bg-card rounded-3xl shadow-2xl border border-accent overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-accent flex items-center justify-between bg-card">
          <h3 id="cart-title" className="text-xl font-extrabold text-ink">
            {step === 0 ? "Tu carrito" : "Datos de compra"}
          </h3>
          <button
            className="px-3 py-1.5 rounded-xl border border-accent bg-card text-brand text-sm font-semibold"
            onClick={closeCart}
          >
            Cerrar
          </button>
        </div>

        {/* Steps */}
        <div className="px-5 pt-4">
          <div className="flex items-center gap-2 text-sm">
            <span className={step === 0 ? "font-bold text-brand" : "text-accent"}>1. Carrito</span>
            <span className="text-accent">›</span>
            <span className={step === 1 ? "font-bold text-brand" : "text-accent"}>2. Datos</span>
          </div>
        </div>

        {/* Error global del submit */}
        {errorMsg && (
          <div className="px-5 pt-3">
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {errorMsg}
            </div>
          </div>
        )}

        {/* Body */}
        {step === 0 ? (
          <div className="max-h-[55vh] overflow-y-auto scroll-thin">
            {safeItems.length === 0 ? (
              <div className="p-8 text-center text-accent">Aún no has agregado productos.</div>
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--shop-accent)" }}>
                {safeItems.map((it) => (
                  <li key={it.key} className="p-4 flex gap-4 items-start">
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-accent bg-card shrink-0">
                      {it.image ? (
                        <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-soft" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-ink">{it.name}</div>
                          <div className="text-[11px] text-accent">
                            Ref: <span className="text-brand font-semibold">{it.ref}</span>{" "}
                            • {it.gender} / {it.category}
                          </div>
                          <div className="text-[11px] text-accent mt-1">
                            {it.size && <>Talla: <span className="text-brand">{it.size}</span> • </>}
                            {it.color && <>Color: <span className="text-brand">{it.color}</span></>}
                          </div>
                        </div>
                        <div className="text-brand font-extrabold whitespace-nowrap">
                          {formatCOP(it.unitPriceCOP)}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            className="px-2 py-1 rounded-lg border border-accent bg-card text-brand text-sm"
                            onClick={() => decQty(it.key)}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={it.qty}
                            onChange={(e) =>
                              changeQty(it.key, Math.max(1, parseInt(e.target.value || "1", 10)))
                            }
                            className="w-16 text-center rounded-lg border border-accent px-2 py-1 text-sm text-ink bg-card"
                          />
                          <button
                            className="px-2 py-1 rounded-lg border border-accent bg-card text-brand text-sm"
                            onClick={() => incQty(it.key)}
                          >
                            +
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-ink font-semibold">
                            {formatCOP(it.qty * it.unitPriceCOP)}
                          </div>
                          <button
                            className="px-3 py-1.5 rounded-xl border border-accent bg-card text-accent text-xs"
                            onClick={() => removeItem(it.key)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="max-h-[55vh] overflow-y-auto scroll-thin p-5">
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-accent">Nombre completo</label>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={onChange}
                    className={`w-full rounded-xl border px-3 py-2 bg-card text-ink ${
                      errors.fullName ? "border-red-500" : "border-accent"
                    }`}
                    placeholder="Juan Pérez"
                    autoComplete="name"
                    required
                  />
                  {errors.fullName && (
                    <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-accent">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={onChange}
                    className={`w-full rounded-xl border px-3 py-2 bg-card text-ink ${
                      errors.email ? "border-red-500" : "border-accent"
                    }`}
                    placeholder="correo@dominio.com"
                    autoComplete="email"
                    required
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-accent">Teléfono</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={onChange}
                    className={`w-full rounded-xl border px-3 py-2 bg-card text-ink ${
                      errors.phone ? "border-red-500" : "border-accent"
                    }`}
                    placeholder="+57 300 000 0000"
                    autoComplete="tel"
                    required
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-accent">Método de entrega</label>
                  <select
                    name="method"
                    value={form.method}
                    onChange={onChange}
                    className="w-full rounded-xl border px-3 py-2 bg-card text-ink border-accent"
                  >
                    <option value="domicilio">Entrega a domicilio</option>
                    <option value="retiro">Retiro en tienda</option>
                  </select>
                </div>

                {form.method === "domicilio" && (
                  <>
                    <div>
                      <label className="text-sm text-accent">Dirección</label>
                      <input
                        name="address"
                        value={form.address}
                        onChange={onChange}
                        className={`w-full rounded-xl border px-3 py-2 bg-card text-ink ${
                          errors.address ? "border-red-500" : "border-accent"
                        }`}
                        placeholder="Calle 123 #45-67"
                        autoComplete="address-line1"
                        required
                      />
                      {errors.address && (
                        <p className="text-xs text-red-600 mt-1">{errors.address}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-accent">Ciudad</label>
                      <input
                        name="city"
                        value={form.city}
                        onChange={onChange}
                        className={`w-full rounded-xl border px-3 py-2 bg-card text-ink ${
                          errors.city ? "border-red-500" : "border-accent"
                        }`}
                        placeholder="Bogotá, Medellín, etc."
                        autoComplete="address-level2"
                        required
                      />
                      {errors.city && (
                        <p className="text-xs text-red-600 mt-1">{errors.city}</p>
                      )}
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="text-sm text-accent">Notas del pedido (opcional)</label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={onChange}
                    className="w-full rounded-xl border px-3 py-2 bg-card text-ink border-accent"
                    rows={3}
                    placeholder="Instrucciones, horarios, etc."
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-accent">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={form.acceptTerms}
                  onChange={onChange}
                />
                Acepto los términos y la política de datos
              </label>
              {errors.acceptTerms && (
                <p className="text-xs text-red-600">{errors.acceptTerms}</p>
              )}
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="p-5 border-t border-accent bg-card">
          <div className="flex items-center justify-between text-sm text-accent">
            <span>Subtotal</span>
            <span>{formatCOP(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-accent mt-1">
            <span>Envío</span>
            <span>{formatCOP(shipping)}</span>
          </div>
          <div className="flex items-center justify-between text-lg font-extrabold text-brand mt-2">
            <span>Total</span>
            <span>{formatCOP(total)}</span>
          </div>

          <div className="mt-4 flex items-center justify-between">
            {step === 0 ? (
              <>
                <button
                  className="px-4 py-2 rounded-xl border border-accent bg-card text-accent text-sm"
                  onClick={clearCart}
                  disabled={safeItems.length === 0}
                >
                  Vaciar carrito
                </button>
                <button
                  className={
                    safeItems.length
                      ? "px-4 py-2 rounded-xl bg-brand text-white text-sm font-semibold"
                      : "px-4 py-2 rounded-xl bg-card text-accent border border-accent text-sm cursor-not-allowed"
                  }
                  disabled={!safeItems.length}
                  onClick={() => setStep(1)}
                >
                  Continuar compra
                </button>
              </>
            ) : (
              <>
                <button
                  className="px-4 py-2 rounded-xl border border-accent bg-card text-accent text-sm"
                  onClick={() => setStep(0)}
                >
                  Volver
                </button>
                <button
                  form="checkout-form"
                  type="submit"
                  disabled={submitting || !safeItems.length}
                  className={
                    !safeItems.length || submitting
                      ? "px-4 py-2 rounded-xl bg-card text-accent border border-accent text-sm cursor-not-allowed"
                      : "px-4 py-2 rounded-xl bg-brand text-white text-sm font-semibold"
                  }
                >
                  {submitting ? "Procesando..." : "Confirmar pedido"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
