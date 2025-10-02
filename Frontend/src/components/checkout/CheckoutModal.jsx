// src/components/checkout/CheckoutModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useCart } from "../../context/cart/cart-context";
import { sendCheckout } from "../../services/checkout/checkoutService";

// Pequeña ayuda para persistir el form del cliente
const FORM_KEY = "checkout:customer";
const loadCustomer = () => {
  try { return JSON.parse(localStorage.getItem(FORM_KEY)) ?? { email:"", phone:"", address:"" }; }
  catch { return { email:"", phone:"", address:"" }; }
};
const saveCustomer = (data) => {
  try { localStorage.setItem(FORM_KEY, JSON.stringify(data)); } catch {
    // no pasa nada si falla el localStorage
  }
};

export default function CheckoutModal({ open, onClose }) {
  const { items, totalCOP, formatCOP, clear, showToast } = useCart();

  const [form, setForm] = useState(loadCustomer);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({}); // {field: message}

  useEffect(() => {
    if (!open) {
      setErrors({});
      setLoading(false);
      // no limpiamos el form: así queda prellenado para la próxima
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
    if ((form.address ?? "").trim().length < 6) err.address = "Dirección muy corta";
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
      await sendCheckout(payload); // 👈 usa el servicio
      showToast?.({ title: "Compra enviada", desc: "Te contactaremos al correo." });
      clear();               // limpia carrito
      onClose?.();           // cierra modal
      // mantenemos datos del cliente para siguiente compra
    } catch (err) {
      const resp = err?.response?.data;
      if (resp?.errors) {
        // Errores de validación de Laravel
        const flat = {};
        Object.entries(resp.errors).forEach(([k, v]) => { flat[k] = v?.[0] ?? "Valor inválido"; });
        setErrors(flat);
      } else if (resp?.message) {
        // e.g., total mismatch u otros
        showToast?.({ title: "No pudimos procesar", desc: resp.message });
      } else {
        showToast?.({ title: "Error al comprar", desc: "Intenta de nuevo en unos minutos." });
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
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl card overflow-hidden">
        <div className="card-header justify-between bg-[hsl(var(--muted))]">
          <h3 className="text-lg font-bold">Finalizar compra</h3>
          <button className="btn btn-ghost is-sm" onClick={onClose} aria-label="Cerrar">✕</button>
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
                            <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
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
                    <td className="font-semibold">{formatCOP(it.price_cents ?? 0)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} className="text-right font-bold">Total</td>
                  <td className="font-extrabold">{formatCOP(totalCOP)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {errors.items && <p className="text-red-600 text-sm">{errors.items}</p>}

          {/* Form */}
          <form className="grid gap-3" onSubmit={onSubmit}>
            <div className="field">
              <label className="label">Correo electrónico</label>
              <input
                className={`input ${errors.email ? "is-danger" : ""}`}
                name="email" type="email" placeholder="tucorreo@dominio.com"
                value={form.email} onChange={handleChange}
              />
              {errors.email && <span className="help text-red-600">{errors.email}</span>}
            </div>

            <div className="field">
              <label className="label">Celular</label>
              <input
                className={`input ${errors.phone ? "is-danger" : ""}`}
                name="phone" type="tel" placeholder="+57 3xx xxx xxxx"
                value={form.phone} onChange={handleChange}
              />
              {errors.phone && <span className="help text-red-600">{errors.phone}</span>}
            </div>

            <div className="field">
              <label className="label">Dirección</label>
              <input
                className={`input ${errors.address ? "is-danger" : ""}`}
                name="address" type="text" placeholder="Calle 123 #45-67, Bogotá"
                value={form.address} onChange={handleChange}
              />
              {errors.address && <span className="help text-red-600">{errors.address}</span>}
            </div>

            <div className="card-footer justify-between bg-[hsl(var(--muted))] rounded-lg">
              <span className="text-sm text-[hsl(var(--text-muted))]">
                Te llegará confirmación al correo.
              </span>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? "Enviando…" : "Comprar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
