import React from "react";
import { useAuth } from "../../context/useAuth.js";
import { useNavigate } from "react-router-dom";
import usePageReady from "../../hooks/usePageReady.js";
import { useRouteLoading } from "../../hooks/useRouteLoading.js";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { className: pageClass } = usePageReady();   // 👈 apaga overlay al montar
  const { setRouteLoading } = useRouteLoading();

  const handleLogout = async () => {
    await logout();
    setRouteLoading(true);            // 👈 muestra overlay al salir
    nav("/login", { replace: true });
  };

  return (
    <div className={`p-6 space-y-4 ${pageClass}`}>
      <h1 className="text-2xl font-semibold">Hola, {user?.name} 👋</h1>
      <p>Estás dentro. Email: {user?.email}</p>
      <button className="rounded bg-black text-white px-4 py-2" onClick={handleLogout}>
        Cerrar sesión
      </button>
    </div>
  );
}
