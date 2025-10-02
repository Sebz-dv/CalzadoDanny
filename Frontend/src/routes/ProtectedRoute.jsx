import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { useRouteLoading } from "../hooks/useRouteLoading.js";
import Loader from "../components/loader/Loader.jsx";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const { routeLoading } = useRouteLoading();

  if (loading) return <Loader fullscreen label="Verificando sesión…" show />; // mientras /me

  if (!user) return <Navigate to="/" replace />;

  return (
    <>
      <Loader fullscreen label="Cambiando de página…" show={routeLoading} />
      <Outlet />
    </>
  );
}
