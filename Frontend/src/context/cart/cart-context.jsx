// src/context/cart/cart-context.jsx
import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";

const CartContext = createContext(null);

// ===== Persistencia =====
const STORAGE_KEY = "cart:v1";

function safeParse(json, fallback) {
  try { return JSON.parse(json); } catch { return fallback; }
}

function loadCartFromStorage() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const data = safeParse(raw, null);
  return Array.isArray(data?.items) ? data.items : [];
}

function saveCartToStorage(items) {
  if (typeof window === "undefined") return;
  // Guarda solo campos serializables y seguros
  const sanitized = items.map(it => ({
    product_id: it.product_id ?? it.id ?? null,
    id: it.id ?? null,
    name: it.name ?? "",
    size: it.size ?? null,
    color: it.color ?? null,
    price_cents: Number(it.price_cents ?? 0),
    image: it.image ?? null,
    qty: Number(it.qty ?? 1),
  }));
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ items: sanitized, updatedAt: Date.now() })
  );
}

export function CartProvider({ children }) {
  // Carga inicial desde storage (evita “parpadeo” vacío)
  const [items, setItems] = useState(() => loadCartFromStorage());
  const [isOpen, setIsOpen] = useState(false);

  // ==== TOAST (notificaciones) ====
  const [toast, setToast] = useState(null); // { title, desc }
  const toastTimer = useRef(null);

  const showToast = useCallback((t) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const clearToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  useEffect(() => {
    // Limpieza del timer al desmontar
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // ==== Cart modal controls ====
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((v) => !v), []);

  // Bloquear scroll cuando el modal está abierto
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = isOpen ? "hidden" : prev || "";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && closeCart();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  // ==== Helpers ====
  const keyOf = (it) =>
    [it.product_id ?? it.id, it.size ?? "", (it.color ?? "").toLowerCase()].join("|");

  const addItem = useCallback((item) => {
    setItems((prev) => {
      const k = keyOf(item);
      const next = [...prev];
      const i = next.findIndex((x) => keyOf(x) === k);
      if (i >= 0) {
        next[i] = { ...next[i], qty: (next[i].qty || 1) + (item.qty || 1) };
      } else {
        next.push({ ...item, qty: item.qty || 1 });
      }
      return next;
    });
    // no abrimos el modal automáticamente
  }, []);

  const removeItem = useCallback((k) => {
    setItems((prev) => prev.filter((it) => keyOf(it) !== k));
  }, []);

  const updateQty = useCallback((k, qty) => {
    const q = Math.max(1, Number(qty) || 1);
    setItems((prev) => prev.map((it) => (keyOf(it) === k ? { ...it, qty: q } : it)));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const count = useMemo(
    () => items.reduce((acc, it) => acc + (it.qty || 0), 0),
    [items]
  );

  // NOTA: mantengo tu lógica: total = suma de price_cents * qty (lo formateas como COP sin dividir /100)
  const totalCOP = useMemo(
    () =>
      items.reduce(
        (acc, it) => acc + Number(it.price_cents || 0) * (it.qty || 0),
        0
      ),
    [items]
  );

  const formatCOP = useCallback((cents) => {
    const pesos = Math.round(Number(cents || 0)); // aquí ya manejas "cents" como COP
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(pesos);
  }, []);

  // ===== Persistencia reactiva (debounced) =====
  const persistTimer = useRef(null);
  useEffect(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => saveCartToStorage(items), 120);
    return () => clearTimeout(persistTimer.current);
  }, [items]);

  // ===== Sincronización entre pestañas =====
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        const next = safeParse(e.newValue, null);
        if (Array.isArray(next?.items)) setItems(next.items);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Helper para notificación estándar de “agregado”
  const notifyAdded = useCallback(
    ({ name, size, color, qty }) => {
      const parts = [
        name || "Producto",
        size ? `• Talla ${size}` : null,
        color ? `• ${color}` : null,
        qty ? `• x${qty}` : null,
      ].filter(Boolean);
      showToast({ title: "Agregado al carrito", desc: parts.join(" ") });
    },
    [showToast]
  );

  const value = {
    // estado
    items,
    count,
    totalCOP,
    total_cents: totalCOP, // alias por compatibilidad
    isOpen,

    // acciones
    addItem,
    removeItem,
    updateQty,
    clear,

    // modal
    openCart,
    closeCart,
    toggleCart,

    // formato
    formatCOP,

    // toast
    toast,
    showToast,
    clearToast,
    notifyAdded,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
