import React, { useState } from "react";
import { useAuth } from "../context/useAuth.js";
import { Link, useNavigate } from "react-router-dom";
import Loader from "../components/loader/Loader.jsx";
import usePageReady from "../hooks/usePageReady.js";
import { useRouteLoading } from "../hooks/useRouteLoading.js";

export default function Register() {
  const nav = useNavigate();
  const { register } = useAuth();

  // Animación de entrada y auto-clear del overlay al montar
  const { className: pageClass } = usePageReady();
  const { routeLoading, setRouteLoading } = useRouteLoading();

  const [name, setName] = useState("Sebas");
  const [email, setEmail] = useState("sebas@example.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const parseError = (err) => {
    const res = err?.response;
    if (!res) return "No hay conexión con el servidor.";
    if (res.data?.message) return res.data.message;
    const e = res.data?.errors;
    if (e) {
      const first = Object.keys(e)[0];
      if (first && e[first]?.[0]) return e[first][0];
    }
    return "Error al registrarse";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (pending) return;
    setError("");
    setPending(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
      setRouteLoading(true);             // 🔥 muestra overlay al cambiar de ruta
      nav("/", { replace: true });
    } catch (err) {
      setError(parseError(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <Loader
        fullscreen
        label={pending ? "Creando tu cuenta…" : "Cambiando de página…"}
        show={routeLoading || pending}
      />

      <div className={`min-h-dvh grid place-items-center p-6 ${pageClass}`}>
        <form
          onSubmit={onSubmit}
          className="w-full max-w-sm space-y-4 border p-6 rounded-xl bg-white/80 backdrop-blur"
        >
          <h1 className="text-xl font-semibold">Crear cuenta</h1>
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div>
            <label className="block text-sm mb-1">Nombre</label>
            <input
              className="w-full border rounded px-3 py-2"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              className="w-full border rounded px-3 py-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Contraseña</label>
            <input
              className="w-full border rounded px-3 py-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            className="w-full rounded bg-black text-white py-2 disabled:opacity-50"
            disabled={pending}
          >
            {pending ? "Creando…" : "Registrarme"}
          </button>

          <p className="text-sm">
            ¿Ya tienes cuenta? <Link className="underline" to="/login">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </>
  );
}
