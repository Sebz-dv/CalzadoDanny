import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/useAuth"; // ajusta ruta

function cx(...xs) { return xs.filter(Boolean).join(" "); }

export default function NavbarUserArea({ navItemsPublic = [], navItemsPrivate = [], open, setOpen }) {
  const { user, logout } = useAuth();
  const [openUser, setOpenUser] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const initials = (user?.name ?? user?.email ?? "?")
    .split(" ")
    .map(s => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Cerrar con click-afuera
  useEffect(() => {
    function onDocClick(e) {
      if (!openUser) return;
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpenUser(false);
    }
    function onEsc(e) {
      if (e.key === "Escape") setOpenUser(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [openUser]);

  return (
    <>
      {/* --- Desktop right area --- */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="relative">
            <button
              ref={btnRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={openUser}
              onClick={() => setOpenUser(v => !v)}
              className="flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-300"
              title={user.email}
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-white text-sm font-bold">
                {initials}
              </span>
              <span className="hidden sm:block text-sm font-medium text-neutral-800">
                {user.name || user.email}
              </span>
              <svg className="h-4 w-4 text-neutral-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.186l3.71-3.955a.75.75 0 111.08 1.04l-4.24 4.52a.75.75 0 01-1.08 0l-4.24-4.52a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>

            {openUser && (
              <div
                ref={menuRef}
                role="menu"
                aria-label="Menú de usuario"
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg"
              >
                <div className="px-4 py-3">
                  <p className="text-sm font-medium text-neutral-900">{user.name || "Usuario"}</p>
                  <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                </div>
                <div className="border-t border-neutral-200" />
                <button
                  role="menuitem"
                  onClick={logout}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-neutral-50"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="px-3 py-2 text-sm font-medium rounded-md text-neutral-700 hover:bg-neutral-100">
              Ingresar
            </Link>
            <Link to="/register" className="px-3 py-2 text-sm font-medium rounded-md bg-neutral-900 text-white hover:bg-neutral-800">
              Crear cuenta
            </Link>
          </div>
        )}
      </div>

      {/* --- Mobile panel (debajo del nav) --- */}
      <div className={cx("lg:hidden border-t border-neutral-200", open ? "block" : "hidden")}>
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 space-y-1">
          {navItemsPublic.map(i => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cx(
                  "block rounded-md px-3 py-2 text-sm font-medium",
                  isActive ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
                )
              }
            >
              {i.label}
            </NavLink>
          ))}
          {user && navItemsPrivate.map(i => (
            <NavLink
              key={i.to}
              to={i.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cx(
                  "block rounded-md px-3 py-2 text-sm font-medium",
                  isActive ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
                )
              }
            >
              {i.label}
            </NavLink>
          ))}
          {user ? (
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm hover:bg-neutral-100"
            >
              Cerrar sesión
            </button>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-sm hover:bg-neutral-100">
                Ingresar
              </Link>
              <Link to="/register" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-sm hover:bg-neutral-100">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
