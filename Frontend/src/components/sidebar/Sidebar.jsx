// src/components/sidebar/Sidebar.jsx
import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FaAngleDown, FaArrowLeft, FaBars, FaSignOutAlt } from "react-icons/fa";
import nookies from "nookies";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { meQuiet } from "../../services/auth";
import SidebarFlyoutPortal from "./SidebarFlyoutPortal";
import ThemeToggle from "../buttons/ThemeToggle";
import { useIsMobile } from "./hooks/useIsMobile";
import { menuItems } from "./data/menuItems";
import SidebarItem from "./SidebarItem";
import { useAuth } from "../../context/useAuth";
import { logoutUser } from "../../utils/logoutUser";

function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const [openSubMenus, setOpenSubMenus] = useState({});
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [flyoutPosition, setFlyoutPosition] = useState(null);

  // Datos user
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Dropdown user
  const [openUser, setOpenUser] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const cookies = nookies.get(null);
  const { user, logout } = useAuth();
  const isAuthenticated = Boolean(cookies.token) || Boolean(user?.email);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const emailCookie = cookies.email;
        if (emailCookie) setUserEmail(decodeURIComponent(emailCookie));
        if (user?.email) return;
        if (!emailCookie) return;
        const decodedEmail = decodeURIComponent(emailCookie);
        const u = await meQuiet(decodedEmail);
        const name = u?.usuario && typeof u.usuario === "object" ? u.usuario.name : "";
        setUserName(name || "");
      } catch (e) {
        console.error("Error fetching user:", e);
      }
    };
    if (isAuthenticated) fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.email]);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile, setSidebarOpen]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && isMobile && sidebarOpen) setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobile, sidebarOpen, setSidebarOpen]);

  useEffect(() => {
    if (!isMobile) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = sidebarOpen ? "hidden" : original || "";
    return () => {
      document.body.style.overflow = original || "";
    };
  }, [isMobile, sidebarOpen]);

  // Swipe-to-close
  useEffect(() => {
    if (!isMobile) return;
    let startX = 0, currentX = 0, touching = false;
    const onTouchStart = (e) => { touching = true; startX = e.touches[0].clientX; currentX = startX; };
    const onTouchMove  = (e) => { if (!touching) return; currentX = e.touches[0].clientX; };
    const onTouchEnd   = () => { if (!touching) return; const d = currentX - startX; if (d < -60 && sidebarOpen) setSidebarOpen(false); touching = false; };
    document.addEventListener("touchstart", onTouchStart);
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [isMobile, sidebarOpen, setSidebarOpen]);

  // Cerrar dropdown user con click-afuera + ESC
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

  const isMenuItemActive = (item) =>
    (item.link && location.pathname === item.link) ||
    (item.children && item.children.some((c) => c.link === location.pathname));
  const isSubMenuItemActive = (sub) => sub.link === location.pathname;

  const displayName = user?.name || userName;
  const displayEmail = user?.email || userEmail;
  const initials = (displayName || displayEmail || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () =>
    logoutUser({
      onContextLogout: logout,
      apiUrl: "/api/auth/logout", // ajusta si usas otra ruta
      navigate,
      afterNavigateTo: "/",
      hardReload: true,
    });

  const MobileHamburger = () =>
    !sidebarOpen ? (
      <button
        aria-label="Abrir menú"
        onClick={() => setSidebarOpen(true)}
        className={[
          "lg:hidden fixed top-3 left-3 z-[60] rounded-full p-2",
          "bg-[hsl(var(--card))]/80 text-[hsl(var(--fg))]",
          "border border-[hsl(var(--border))]/20 shadow-md active:scale-95",
        ].join(" ")}
      >
        <FaBars />
      </button>
    ) : null;

  return (
    <>
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-[hsl(var(--fg))]/50 backdrop-blur-[1px]"
          aria-hidden="true"
        />
      )}

      <MobileHamburger />

      <motion.aside
        animate={!isMobile ? { width: sidebarOpen ? 256 : 64 } : {}}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className={[
          "z-50 rounded-none lg:rounded-xl shadow-lg",
          "fixed lg:sticky inset-y-0 left-0",
          "w-72 max-w-[85vw] lg:w-auto",
          "transform transition-transform duration-300 ease-in-out",
          isMobile ? (sidebarOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
          "lg:top-0 lg:h-screen",
          "border-r overflow-visible", // <- importante para no recortar el dropdown
          "bg-[hsl(var(--bg))] text-[hsl(var(--fg))] border-[hsl(var(--border))]/20",
        ].join(" ")}
        role="dialog"
        aria-modal={isMobile ? true : false}
        aria-label="Barra lateral de navegación"
      >
        <div className="h-full w-full flex flex-col bg-[hsl(var(--bg))] text-[hsl(var(--fg))]">
          {/* Header */}
          <div
            className={[
              "flex items-center p-4 border-b",
              sidebarOpen ? "justify-between" : "justify-center",
              "border-[hsl(var(--border))]/20",
            ].join(" ")}
          >
            {sidebarOpen && (
              <div className="flex items-center space-x-2">
                <img src="/logipack.png" alt="Logipack" width={60} height={60} loading="eager" />
                <img src="/logipack_name.png" alt="Logipack" width={100} height={60} loading="eager" />
              </div>
            )}
            <button
              onClick={() => setSidebarOpen((p) => !p)}
              className={[
                "p-2 rounded transition-colors",
                "bg-[hsl(var(--card))] text-[hsl(var(--fg))]",
                "border border-[hsl(var(--border))]/20 hover:border-[hsl(var(--border))]/40",
              ].join(" ")}
              aria-label={sidebarOpen ? "Cerrar Sidebar" : "Abrir Sidebar"}
            >
              {sidebarOpen ? <FaArrowLeft /> : <FaBars />}
            </button>
          </div>

          {/* Menú */}
          <nav className="flex-1 overflow-y-auto py-2">
            {menuItems.map((item) => (
              <div
                key={item.key}
                onMouseEnter={(e) => {
                  if (!isMobile && sidebarOpen && item.children) {
                    setOpenSubMenus((prev) => ({ ...prev, [item.key]: true }));
                  } else if (!isMobile && !sidebarOpen && item.children) {
                    setHoveredMenu(item.key);
                    const rect = e.currentTarget.getBoundingClientRect();
                    setFlyoutPosition({ top: rect.top, left: rect.right + 6 });
                  }
                }}
                onMouseLeave={() => {
                  if (!isMobile && sidebarOpen && item.children) {
                    setOpenSubMenus((prev) => ({ ...prev, [item.key]: false }));
                  } else if (!isMobile && item.children) {
                    setHoveredMenu(null);
                    setFlyoutPosition(null);
                  }
                }}
                className="relative"
              >
                {!item.children && (
                  <SidebarItem
                    active={isMenuItemActive(item)}
                    icon={item.icon}
                    label={item.label}
                    onClick={() => item.link && navigate(item.link)}
                    sidebarOpen={sidebarOpen}
                  />
                )}

                {item.children && (
                  <>
                    <SidebarItem
                      active={isMenuItemActive(item)}
                      icon={item.icon}
                      label={item.label}
                      onClick={() => {
                        if (!sidebarOpen) setSidebarOpen(true);
                        else
                          setOpenSubMenus((prev) => ({
                            ...prev,
                            [item.key]: !prev[item.key],
                          }));
                      }}
                      sidebarOpen={sidebarOpen}
                    >
                      <FaAngleDown className={`${openSubMenus[item.key] ? "rotate-180" : ""}`} />
                    </SidebarItem>

                    {/* Flyout (desktop, colapsado) */}
                    <AnimatePresence>
                      {!isMobile && !sidebarOpen && hoveredMenu === item.key && flyoutPosition && (
                        <SidebarFlyoutPortal>
                          <motion.div
                            key={item.key}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.18 }}
                            className={[
                              "fixed z-[9999] min-w-[200px] py-2",
                              "rounded-2xl border shadow-[0_12px_32px_-6px_rgba(0,0,0,0.55)]",
                              "ring-1",
                              "border-[hsl(var(--border))] ring-[hsl(var(--ring))]/15",
                            ].join(" ")}
                            style={{
                              top: flyoutPosition.top,
                              left: flyoutPosition.left,
                              background: `hsl(var(--card))`,
                              color: `hsl(var(--fg))`,
                            }}
                            onMouseLeave={() => {
                              setHoveredMenu(null);
                              setFlyoutPosition(null);
                            }}
                            onMouseEnter={() => setHoveredMenu(item.key)}
                            role="menu"
                            aria-label={item.label}
                          >
                            {item.children.map((sub) => {
                              const active = isSubMenuItemActive(sub);
                              return (
                                <div
                                  key={sub.key}
                                  role="menuitem"
                                  tabIndex={0}
                                  aria-current={active}
                                  className={[
                                    "group flex items-center cursor-pointer select-none",
                                    "px-3 py-2 mx-1 rounded-lg",
                                    "transition-[background,transform] duration-150",
                                    "hover:bg-[hsl(var(--muted))]/30 active:bg-[hsl(var(--muted))]/40",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
                                    active
                                      ? "bg-[hsl(var(--muted))]/40 border-l-4 border-l-[hsl(var(--accent))]"
                                      : "border-l-4 border-l-transparent",
                                  ].join(" ")}
                                  onClick={() => {
                                    if (sub.link) navigate(sub.link);
                                    setHoveredMenu(null);
                                    setFlyoutPosition(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      if (sub.link) navigate(sub.link);
                                      setHoveredMenu(null);
                                      setFlyoutPosition(null);
                                    }
                                  }}
                                >
                                  <sub.icon
                                    className={[
                                      "text-lg mr-2",
                                      active
                                        ? "text-[hsl(var(--accent))]"
                                        : "text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--fg))]",
                                    ].join(" ")}
                                  />
                                  <span className={active ? "text-[hsl(var(--fg))]" : "text-[hsl(var(--fg))]/90"}>
                                    {sub.label}
                                  </span>
                                </div>
                              );
                            })}
                          </motion.div>
                        </SidebarFlyoutPortal>
                      )}
                    </AnimatePresence>

                    {/* Submenú acordeón (expandido) */}
                    <AnimatePresence initial={false}>
                      {openSubMenus[item.key] && sidebarOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="ml-8 overflow-hidden"
                        >
                          {item.children.map((sub) => {
                            const active = isSubMenuItemActive(sub);
                            return (
                              <div
                                key={sub.key}
                                role="button"
                                tabIndex={0}
                                aria-current={active}
                                className={[
                                  "flex items-center cursor-pointer p-2 rounded transition-colors select-none",
                                  active ? "bg-[hsl(var(--muted))]/40" : "hover:bg-[hsl(var(--muted))]/30",
                                ].join(" ")}
                                onClick={() => sub.link && navigate(sub.link)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    if (sub.link) navigate(sub.link);
                                  }
                                }}
                                style={{
                                  borderLeft: active ? "3px solid hsl(var(--accent))" : "3px solid transparent",
                                  transition: "border-color 0.2s, background 0.2s",
                                }}
                              >
                                <sub.icon className="text-lg mr-2" />
                                {sidebarOpen && <span>{sub.label}</span>}
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="mt-auto p-3 border-t border-[hsl(var(--border))]/20 overflow-visible">
            <ThemeToggle
              showLabel={sidebarOpen}
              className={["w-full", sidebarOpen ? "justify-center mb-2" : "justify-center mb-2 p-2"].join(" ")}
            />

            {/* Menú de usuario */}
            <div className="relative">
              <button
                ref={btnRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={openUser}
                onClick={() => setOpenUser((v) => !v)}
                title={displayEmail || displayName || "Usuario"}
                className={[
                  "w-full flex items-center",
                  sidebarOpen ? "justify-start" : "justify-center",
                  "gap-2 rounded-full pl-2 pr-3 py-1.5",
                  "bg-transparent hover:bg-[hsl(var(--muted))]/40",
                  "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/60",
                ].join(" ")}
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--fg))] text-white text-sm font-bold">
                  {initials}
                </span>

                {sidebarOpen && (
                  <>
                    <span className="truncate text-sm font-medium text-[hsl(var(--fg))] max-w-[120px]">
                      {displayName || "Usuario"}
                    </span>
                    <FaAngleDown
                      className={[
                        "ml-auto transition-transform",
                        openUser ? "rotate-180" : "rotate-0",
                        "text-[hsl(var(--muted-foreground))]",
                      ].join(" ")}
                    />
                  </>
                )}
              </button>

              {/* Dropdown ajustado */}
              <AnimatePresence>
                {openUser && (
                  <motion.div
                    ref={menuRef}
                    role="menu"
                    aria-label="Menú de usuario"
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.16 }}
                    className={[
                      "absolute bottom-12",
                      // 👉 cuando colapsado, saca el menú a la derecha del sidebar
                      sidebarOpen ? "right-3" : "left-full ml-2",
                      "w-60 max-h-[min(60vh,320px)] overflow-auto",
                      "rounded-xl border border-[hsl(var(--border))]",
                      "bg-[hsl(var(--card))] text-[hsl(var(--fg))]",
                      "shadow-[0_12px_32px_-6px_rgba(0,0,0,0.45)]",
                      "z-[200] pointer-events-auto",
                      "origin-bottom-right",
                    ].join(" ")}
                  >
                    <div className="px-4 py-3">
                      <p className="text-sm font-medium text-[hsl(var(--fg))]">
                        {displayName || "Usuario"}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                        {displayEmail || "—"}
                      </p>
                    </div>
                    <div className="border-t border-[hsl(var(--border))]" />
                    <button
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-2 hover:bg-[hsl(var(--muted))]/35"
                    >
                      <FaSignOutAlt />
                      Cerrar sesión
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

Sidebar.propTypes = {
  sidebarOpen: PropTypes.bool.isRequired,
  setSidebarOpen: PropTypes.func.isRequired,
};

export default Sidebar;
