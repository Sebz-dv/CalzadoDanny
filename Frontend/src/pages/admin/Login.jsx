import React, { useEffect, useRef, useState, forwardRef, useId } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock } from "lucide-react";

import { useAuth } from "../../context/useAuth.js";
import Loader from "../../components/loader/Loader.jsx";
import usePageReady from "../../hooks/usePageReady.js";
import { useRouteLoading } from "../../hooks/useRouteLoading.js";

/* ================= Helpers ================= */
function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

/* ================= Marca / logo (placeholder) ================= */
const DEFAULT_ICON = "https://cdn-icons-png.flaticon.com/512/3075/3075977.png";
function useCompanyLogo() {
  const name = "DoMore";
  const dicebear = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
  return { name, src: dicebear || DEFAULT_ICON };
}

/* ============ Input con label flotante, tokens y estados ============ */
const InputFL = forwardRef(function InputFL(
  {
    id,
    label,
    type = "text",
    value,
    onChange,
    onKeyUp,
    autoComplete,
    inputMode,
    icon: LeftIcon, // lucide icon
    rightSlot,
    error,
    hint,
    disabled = false,
    size = "md", // "sm" | "md" | "lg"
    className,
    name,
    required = true,
    spellCheck = false,
    enterKeyHint,
  },
  ref
) {
  const rid = useId();
  const inputId = id || `in-${rid}`;
  const hasIcon = !!LeftIcon;

  const sizes = {
    sm: { py: "py-2", text: "text-sm", icon: "h-4 w-4", radius: "rounded-lg" },
    md: { py: "py-3", text: "text-base", icon: "h-4 w-4", radius: "rounded-xl" },
    lg: { py: "py-3.5", text: "text-base", icon: "h-5 w-5", radius: "rounded-2xl" },
  }[size];

  return (
    <div className={cn("relative", className)}>
      {hasIcon && (
        <LeftIcon
          aria-hidden
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2",
            "text-muted", 
            sizes.icon
          )}
        />
      )}

      <input
        ref={ref}
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onKeyUp={onKeyUp}
        autoComplete={autoComplete}
        inputMode={inputMode}
        enterKeyHint={enterKeyHint}
        spellCheck={spellCheck}
        required={required}
        disabled={disabled}
        placeholder=" "
        aria-invalid={!!error}
        aria-errormessage={error ? `${inputId}-error` : undefined}
        aria-describedby={hint ? `${inputId}-hint` : undefined}
        className={cn(
          "peer input transition-all", // usa tu .input (tokens)
          sizes.text,
          sizes.radius,
          sizes.py,
          hasIcon ? "pl-10 pr-11" : "px-4 pr-11",
          error && "ring-2 border-destructive/60",
          disabled && "opacity-60 cursor-not-allowed"
        )}
        // refuerza focus ring brand (tu utilidad)
        onFocus={(e) => e.currentTarget.classList.add("ring-brand")}
        onBlur={(e) => e.currentTarget.classList.remove("ring-brand")}
      />

      <label
        htmlFor={inputId}
        className={cn(
          "pointer-events-none absolute transition-all",
          hasIcon ? "left-10" : "left-4",
          "top-1/2 -translate-y-1/2",
          "text-sm text-muted",
          // flotar al focus o cuando hay contenido
          "peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:text-base",
          "peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:-translate-y-0 peer-[&:not(:placeholder-shown)]:text-xs"
        )}
      >
        {label}
      </label>

      {rightSlot && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {rightSlot}
        </div>
      )}

      <div className="mt-1 min-h-[1.25rem]">
        {error ? (
          <span id={`${inputId}-error`} className="text-xs text-destructive">
            {error}
          </span>
        ) : hint ? (
          <span id={`${inputId}-hint`} className="text-xs text-muted">
            {hint}
          </span>
        ) : null}
      </div>
    </div>
  );
});

/* ===== Campo de contraseña con toggle + aviso CapsLock ===== */
function PasswordField({
  id,
  label = "Contraseña",
  value,
  onChange,
  autoComplete = "current-password",
  icon: LeftIcon,
  error,
  hint,
  disabled,
  size,
  name = "password",
}) {
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);

  return (
    <InputFL
      id={id}
      name={name}
      type={show ? "text" : "password"}
      label={label}
      value={value}
      onChange={onChange}
      onKeyUp={(e) => setCaps(e.getModifierState?.("CapsLock"))}
      autoComplete={autoComplete}
      icon={LeftIcon}
      error={error}
      hint={caps ? "Bloq Mayús activado" : hint}
      disabled={disabled}
      size={size}
      rightSlot={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="text-muted hover:text-base transition"
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={show}
        >
          {show ? (
            // EyeOff
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path
                d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M9.88 5.09A9.84 9.84 0 0112 5c5 0 9 4 10 7-.27.8-.7 1.57-1.25 2.28"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M6.24 6.24C4.01 7.6 2.39 9.52 2 12c1 3 5 7 10 7 1.3 0 2.55-.24 3.7-.68"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            // Eye
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}
        </button>
      }
    />
  );
}

/* ====== Autofill (respetando tokens, sin amarillo agresivo) ====== */
function AutofillFix() {
  return (
    <style>{`
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus {
        -webkit-text-fill-color: hsl(var(--fg));
        -webkit-box-shadow: 0 0 0px 1000px hsl(var(--card)) inset;
        transition: background-color 5000s ease-in-out 0s;
        caret-color: hsl(var(--fg));
      }
      input { font-size: 16px; }
    `}</style>
  );
}

/* =============================== Página =============================== */
export default function Login() {
  const nav = useNavigate();
  const { user, login } = useAuth();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin12320*");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const emailRef = useRef(null);

  const { className: pageClass } = usePageReady();
  const { routeLoading, setRouteLoading } = useRouteLoading();

  // Marca y logo
  const { name: companyName, src: logoSrc } = useCompanyLogo();

  // Si ya está logueado, redirige
  useEffect(() => {
    if (user) nav("/dashboard", { replace: true });
  }, [user, nav]);

  // Focus inicial
  useEffect(() => {
    const t = setTimeout(() => emailRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  const parseError = (err) => {
    const res = err?.response;
    if (!res) return "No hay conexión con el servidor.";
    if (res.data?.message) return res.data.message;
    const e = res.data?.errors;
    if (e) {
      const first = Object.keys(e)[0];
      if (first && e[first]?.[0]) return e[first][0];
    }
    return "Error al iniciar sesión";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (pending) return;
    setError("");
    setPending(true);
    try {
      await login(email.trim().toLowerCase(), password);
      setRouteLoading(true);
      nav("/dashboard", { replace: true });
    } catch (err) {
      setError(parseError(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {/* Overlay global */}
      <Loader
        fullscreen
        label={pending ? "Entrando…" : "Cambiando de página…"}
        show={routeLoading || pending}
      />

      <AutofillFix />

      {/* Fondo: base + gradiente de marca sutil */}
      <div
        className={cn(
          "relative min-h-dvh flex items-center justify-center px-4 overflow-hidden",
          "bg-base", // usa --bg
          pageClass
        )}
      >
        {/* gradiente suave con tus tokens */}
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-brand-gradient" />
        </div>

        {/* patrón sutil usando --border */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            maskImage: "radial-gradient(circle at center, white 10%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(circle at center, white 10%, transparent 70%)",
          }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
              backgroundSize: "28px 28px, 28px 28px",
              backgroundPosition: "-14px -14px, -14px -14px",
            }}
          />
        </div>

        {/* Card principal (usa .card) */}
        <AnimatePresence>
          <motion.div
            key="login-card"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl p-0 rounded-app"
          >
            <div className="card overflow-hidden flex flex-col sm:flex-row">
              {/* Panel visual (logo + texto) */}
              <div className="bg-primary/5 p-6 sm:p-8 flex flex-col items-center justify-center sm:w-1/2 order-1 sm:order-none">
                <div className="relative">
                  <img
                    src={logoSrc}
                    alt={`Logo ${companyName}`}
                    className="w-24 sm:w-28 mb-4 rounded-app border border-base object-cover bg-card shadow-soft"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      if (e.currentTarget.src !== DEFAULT_ICON) e.currentTarget.src = DEFAULT_ICON;
                    }}
                  />
                  <div
                    className="absolute inset-0 -z-10 blur-2xl opacity-40 rounded-app"
                    style={{
                      background:
                        "radial-gradient(60px 60px at 50% 50%, hsl(var(--accent)/.25), transparent)",
                    }}
                  />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-center mb-2 text-base">
                  Bienvenido a {companyName}
                </h2>
                <p className="text-sm text-muted text-center max-w-xs leading-relaxed">
                  Organiza tus actividades, mantén el control y alcanza tus metas.
                </p>
                <span className="mt-6 text-xs text-muted">
                  © {new Date().getFullYear()} DoMore
                </span>
              </div>

              {/* Formulario */}
              <div className="w-full sm:w-1/2 p-8 sm:p-10 flex flex-col justify-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-center text-base mb-8">
                  Inicia sesión 🚀
                </h1>

                <form onSubmit={onSubmit} className="space-y-4" noValidate autoComplete="on">
                  <InputFL
                    ref={emailRef}
                    id="email"
                    name="email"
                    type="email"
                    label="Correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyUp={(e) => setCapsLockOn(e.getModifierState?.("CapsLock"))}
                    autoComplete="email"
                    inputMode="email"
                    enterKeyHint="next"
                    spellCheck={false}
                    icon={Mail}
                    size="md"
                  />

                  <PasswordField
                    id="password"
                    name="password"
                    label="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    icon={Lock}
                    size="md"
                  />

                  {capsLockOn && (
                    <div className="text-xs text-warning -mt-1">Bloq Mayús activado</div>
                  )}

                  {error && (
                    <div className="alert alert-destructive">
                      <span className="text-destructive-foreground">{error}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <label className="inline-flex items-center gap-2 select-none text-muted">
                      <input
                        type="checkbox"
                        className="rounded border-base"
                        style={{ accentColor: `hsl(var(--accent))` }}
                      />
                      Recuérdame
                    </label>
                    <Link to="/forgot-password" className="text-primary underline-offset-2 hover:underline">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={pending || !email || !password}
                    className={cn(
                      "w-full btn btn-primary",
                      "transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {pending ? (
                      <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground/80 border-t-transparent" />
                    ) : (
                      "Ingresar"
                    )}
                  </button>
                </form>

                <div className="mt-4 text-center text-sm text-muted">
                  <span>¿No tienes cuenta? </span>
                  <Link to="/register" className="text-primary underline-offset-2 hover:underline">
                    Regístrate
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* utilidades de animación suaves */}
        <style>{`
          .animate-bounce-slow { animation: bounceSlow 3.5s ease-in-out infinite; }
          @keyframes bounceSlow { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
          @media (prefers-reduced-motion: reduce) { .animate-bounce-slow { animation: none !important; } }
        `}</style>
      </div>
    </>
  );
}
