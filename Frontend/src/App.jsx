// App.jsx
import React from "react";
import { Routes, Route, Outlet, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import AppLayout from "./layouts/AppLayout"; // público (navbar público, etc.)
import AdminLayout from "./layouts/AdminLayout"; // privado (sidebar admin, etc.)
import Carrusel from "./pages/admin/Carrusel";
import { useAuth } from "./context/useAuth"; // tu hook real

/* Layouts contenedores */
function PublicShell() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

function AdminShell() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

/* Ruta protegida (usa tu auth real) */
function ProtectedRoute() {
  const { user } = useAuth(); // boolean/obj según tu contexto
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      {/* PÚBLICAS */}
      <Route element={<PublicShell />}>
        <Route path="/" element={<Login />} /> {/* Home muestra login */}
      </Route>
        <Route path="/login" element={<Login />} />
      {/* Ruta explícita */}

      {/* PRIVADAS */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/carrusel" element={<Carrusel />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<div className="p-6">404</div>} />
    </Routes>
  );
}
