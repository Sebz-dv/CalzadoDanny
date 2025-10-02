import React from "react";
import PropTypes from "prop-types";
import { FaMoon, FaSun } from "react-icons/fa";
import { useTheme } from "../../hooks/useTheme"; // ajusta la ruta si usas alias

export default function ThemeToggle({ className = "", showLabel = true }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Cambiar a tema ${isDark ? "claro" : "oscuro"}`}
      title={`Cambiar a tema ${isDark ? "claro" : "oscuro"}`}
      className={[
        "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm",
        "border border-foreground/20 hover:border-foreground/40",
        "bg-background hover:bg-background/90 text-foreground",
        "shadow-sm active:scale-[0.98] transition-colors",
        className,
      ].join(" ")}
    >
      {isDark ? <FaSun /> : <FaMoon />}
      {showLabel && <span>{isDark ? "Claro" : "Oscuro"}</span>}
    </button>
  );
}

ThemeToggle.propTypes = {
  className: PropTypes.string,
  /** Si es false, muestra solo el ícono (ideal para sidebar colapsado) */
  showLabel: PropTypes.bool,
};
