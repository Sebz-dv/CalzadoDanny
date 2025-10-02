// src/cart/cart-context.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

// === Persistencia ===
const LS_KEY = "shop_cart_v1";

// Normaliza precios tipo 59.99 -> 59990 (demo). Ajusta si no lo necesitas.
function normalizeCOP(n) {
  return n < 1000 ? Math.round(n * 1000) : n;
}
function formatCOP(n) {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(n);
  } catch {
    return `$${n}`;
  }
}

// Estado inicial + hidratación desde LS
const initialState = { items: [], open: false };
function fromStorage() {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return initialState;
    return { ...initialState, items: parsed.items };
  } catch {
    return initialState;
  }
}

// Reducer
function reducer(state, action) {
  switch (action.type) {
    case "HYDRATE": {
      return {
        ...state,
        items: Array.isArray(action.items) ? action.items : state.items,
      };
    }
    case "OPEN":
      return { ...state, open: true };
    case "CLOSE":
      return { ...state, open: false };
    case "CLEAR":
      return { ...state, items: [] };

    case "ADD_ITEM": {
      const { product, size, color, qty } = action.payload;
      const unitPriceCOP = normalizeCOP(product.price);
      const key = `${product.id}-${size || "ns"}-${color || "nc"}`;
      const ref = `${(product.gender || "x").slice(0, 1).toUpperCase()}-${(
        product.category || "gen"
      )
        .slice(0, 3)
        .toUpperCase()}-${product.id}`;

      const next = [...state.items];
      const idx = next.findIndex((i) => i.key === key);
      if (idx >= 0) {
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return { ...state, items: next };
      }
      next.push({
        key,
        id: product.id,
        ref,
        name: product.name,
        image: product.images?.[0],
        gender: product.gender,
        category: product.category,
        size,
        color,
        qty,
        unitPriceCOP,
      });
      return { ...state, items: next };
    }

    case "REMOVE_ITEM": {
      const key = action.key;
      return { ...state, items: state.items.filter((i) => i.key !== key) };
    }

    case "UPDATE_QTY": {
      const { key, qty } = action;
      if (qty <= 0) {
        return { ...state, items: state.items.filter((i) => i.key !== key) };
      }
      return {
        ...state,
        items: state.items.map((i) => (i.key === key ? { ...i, qty } : i)),
      };
    }

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, fromStorage);

  // Persistir en localStorage cuando cambien los items
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ items: state.items }));
    } catch (err) {
      // ignore write errors (e.g., private mode)
      // eslint-disable-next-line no-console
      console.debug?.("[cart] persist failed", err);
      // Alternativa sin logs:
      // const _unused = err; // evita "no-empty"
    }
  }, [state.items]);

  // Sincronizar entre pestañas
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === LS_KEY) {
        try {
          const next = JSON.parse(e.newValue || "{}");
          if (Array.isArray(next.items)) {
            dispatch({ type: "HYDRATE", items: next.items });
          }
        } catch (err) {
          console.debug?.("[cart] storage event parse error", err);
          // Alternativa sin logs:
          // const _unused = err;
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Selectores
  const count = useMemo(
    () => state.items.reduce((s, i) => s + i.qty, 0),
    [state.items]
  );
  const totalCOP = useMemo(
    () => state.items.reduce((s, i) => s + i.qty * i.unitPriceCOP, 0),
    [state.items]
  );

  // API
  // dentro de useMemo(() => ({ ... }), [state.items, state.open, count, totalCOP])
  const api = useMemo(() => {
    const findQty = (key) => state.items.find((i) => i.key === key)?.qty ?? 0;

    return {
      // estado
      items: state.items,
      open: state.open,

      // selectores
      count,
      totalCOP,
      formatCOP,

      // acciones de UI
      openCart: () => dispatch({ type: "OPEN" }),
      closeCart: () => dispatch({ type: "CLOSE" }),

      // carrito
      clearCart: () => dispatch({ type: "CLEAR" }),
      addItem: (product, { size, color, qty }) =>
        dispatch({ type: "ADD_ITEM", payload: { product, size, color, qty } }),
      removeItem: (key) => dispatch({ type: "REMOVE_ITEM", key }),
      updateQty: (key, qty) => dispatch({ type: "UPDATE_QTY", key, qty }),

      // helpers que usa tu CartModal:
      incQty: (key) => {
        const next = findQty(key) + 1;
        dispatch({ type: "UPDATE_QTY", key, qty: next });
      },
      decQty: (key) => {
        const next = findQty(key) - 1; // el reducer ya elimina si <= 0
        dispatch({ type: "UPDATE_QTY", key, qty: next });
      },
      changeQty: (key, val) => {
        const n = Math.max(1, parseInt(val, 10) || 1);
        dispatch({ type: "UPDATE_QTY", key, qty: n });
      },
    };
  }, [state.items, state.open, count, totalCOP]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

// El plugin puede marcar advertencia aquí en algunos setups.
// Permitimos exportar el hook desde este archivo.
// eslint-disable-next-line react-refresh/only-export-components
export const useCartExported = useCart;
