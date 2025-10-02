// src/utils/logoutUser.js
import nookies from "nookies";

/**
 * Cierra sesión del usuario de forma robusta.
 * - Intenta llamar al endpoint de logout del backend (para cookies HttpOnly).
 * - Limpia cookies locales en múltiples domain/path (por si quedaron residuos).
 * - Limpia localStorage/sessionStorage.
 * - Navega a afterNavigateTo y (opcional) recarga la app.
 *
 * @param {Object} opts
 * @param {Function=} opts.onContextLogout   - p.ej. useAuth().logout
 * @param {string=}   opts.apiUrl            - endpoint del backend para logout
 * @param {string=}   opts.method            - método HTTP (POST/GET)
 * @param {boolean=}  opts.includeCredentials- enviar cookies al backend
 * @param {string[]=} opts.cookieNames       - nombres de cookies a limpiar
 * @param {string[]=} opts.extraCookieDomains- dominios extra a intentar
 * @param {string[]=} opts.extraCookiePaths  - paths extra a intentar
 * @param {Function=} opts.navigate          - react-router navigate
 * @param {string=}   opts.afterNavigateTo   - ruta destino después del logout
 * @param {boolean=}  opts.hardReload        - forzar reload tras navegar
 */
export async function logoutUser({
  onContextLogout,
  apiUrl = "/api/auth/logout",
  method = "POST",
  includeCredentials = true,
  cookieNames = ["token", "userName", "userData", "email", "role"],
  extraCookieDomains = [],
  extraCookiePaths = ["/", "/api", ""],
  navigate,
  afterNavigateTo = "/",
  hardReload = true,
} = {}) {
  // 1) Si tienes estado global (context), úsalo primero
  try {
    if (typeof onContextLogout === "function") {
      await onContextLogout();
    }
  } catch (err) {
    console.warn("onContextLogout() falló:", err);
  }

  // 2) Intentar logout en backend (para borrar cookie HttpOnly)
  try {
    if (apiUrl) {
      await fetch(apiUrl, {
        method,
        credentials: includeCredentials ? "include" : "same-origin",
        headers: { "Content-Type": "application/json" },
      }).catch(() => {});
    }
  } catch (err) {
    console.warn("fetch logout falló:", err);
  }

  // 3) Limpieza agresiva de cookies locales (por si hay varias variantes)
  try {
    const host = typeof window !== "undefined" ? window.location.hostname : "";
    const variants = buildDomainVariants(host);
    const domains = [...new Set([...variants, ...extraCookieDomains])];
    const paths = [...new Set(extraCookiePaths)];

    cookieNames.forEach((name) => {
      paths.forEach((p) => {
        // nookies
        try {
          nookies.destroy(null, name, { path: p || "/" });
        } catch {
            // Ignorar
        }
        domains.forEach((d) => {
          try {
            nookies.destroy(null, name, { path: p || "/", domain: d });
          } catch {
            // Ignorar
          }
          // Fallback manual por si acaso:
          try {
            document.cookie =
              `${name}=; Max-Age=0; Path=${p || "/"};` + (d ? ` Domain=${d};` : "");
          } catch {
            // Ignorar
          }
        });
      });
    });
  } catch (err) {
    console.warn("Error limpiando cookies:", err);
  }

  // 4) Storages
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    // Ignorar
  }

  // 5) Navegar y asegurar que no quede estado zombie en memoria
  try {
    if (typeof navigate === "function") {
      navigate(afterNavigateTo, { replace: true });
      if (hardReload) setTimeout(() => window.location.reload(), 0);
    } else if (hardReload && typeof window !== "undefined") {
      // Si no pasaron navigate, al menos recarga a la ruta indicada
      if (window.location.pathname !== afterNavigateTo) {
        window.location.assign(afterNavigateTo);
      } else {
        window.location.reload();
      }
    }
  } catch (err) {
    console.warn("Navegación/reload falló:", err);
  }
}

/** Genera variantes de dominio para intentar borrar cookies en distintos niveles. */
function buildDomainVariants(hostname) {
  if (!hostname) return [];
  const parts = hostname.split(".");
  const variants = new Set();

  // exacto
  variants.add(hostname);
  variants.add(`.${hostname}`);

  // raíz (e.g., sub.app.tu.com -> tu.com)
  if (parts.length >= 2) {
    const root = parts.slice(-2).join(".");
    variants.add(root);
    variants.add(`.${root}`);
  }
  return Array.from(variants);
}
