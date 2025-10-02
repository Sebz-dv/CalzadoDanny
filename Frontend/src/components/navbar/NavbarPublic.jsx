import React, { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import CartButton from "../car/CartButton.jsx";
import { IoMdSearch } from "react-icons/io";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import Logo from "../../assets/logo.png";
import { useCart } from "../../context/cart/cart-context";

const Menu = [
  { id: 1, name: "Inicio", link: "/" },
  { id: 2, name: "Nosotros", link: "/about" },
  { id: 3, name: "Tienda", link: "/shop" },
  { id: 4, name: "Contacto", link: "/contact" },
  { id: 5, name: "Login", link: "/login" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const [maxHeight, setMaxHeight] = useState("0px");
  const { openCart, count } = useCart();

  useEffect(() => {
    if (isOpen && menuRef.current) setMaxHeight(menuRef.current.scrollHeight + "px");
    else setMaxHeight("0px");
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [isOpen]);

  return (
    <nav className="sticky top-0 shadow-lg bg-[#191410] text-[#FAEAD7] z-40">
      {/* Banner Superior */}
      <div className="bg-gradient-to-r from-[#48331E] to-[#AC9484] text-[#FAEAD7] text-sm sm:text-base px-4 py-1.5 text-center tracking-[0.25em] font-semibold shadow-md">
        - D e s d e - 1 9 7 4 -
      </div>

      {/* Contenido */}
      <div className="border-t border-[#48331E]">
        <div className="container mx-auto px-4">
          {/* Fila: hamburguesa/logo | menú centrado | acciones */}
          <div className="grid grid-cols-2 md:grid-cols-[auto_1fr_auto] items-center min-h-[72px] py-2 gap-3">
            {/* Izq (móvil)/Logo */}
            <div className="flex items-center gap-2">
              {/* Hamburguesa móvil */}
              <button
                onClick={() => setIsOpen((o) => !o)}
                className="md:hidden text-[#FAEAD7] text-3xl p-2"
                aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={isOpen}
                aria-controls="mobile-menu"
              >
                {isOpen ? <HiOutlineX /> : <HiOutlineMenu />}
              </button>

              {/* Logo */}
              <NavLink to="/" aria-label="Inicio" className="inline-flex items-center">
                {Logo ? (
                  <img
                    src={Logo}
                    alt="Logo"
                    className="h-14 sm:h-16 object-contain"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  <span className="text-2xl font-bold">Danny&apos;s</span>
                )}
              </NavLink>
            </div>

            {/* Menú desktop (CENTRADO y alineado al logo) */}
            <ul className="hidden md:flex justify-center items-center gap-2 lg:gap-6">
              {Menu.map((item) => (
                <li key={item.id} className="leading-none">
                  <NavLink
                    to={item.link}
                    className={({ isActive }) =>
                      [
                        // altura y alineación vertical exacta con el logo:
                        "inline-flex items-center h-14 px-3 rounded-full font-medium transition-all duration-200",
                        isActive
                          ? "text-[#191410] bg-[#FAEAD7]"
                          : "text-white hover:text-[#FAEAD7] hover:underline",
                      ].join(" ")
                    }
                  >
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* Acciones derecha */}
            <div className="flex justify-end items-center gap-2 sm:gap-4">
              {/* Carrito */}
              <CartButton onClick={openCart} count={count} />
            </div>
          </div>

         
          {/* Overlay fondo cuando el menú está abierto (móvil) */}
          {isOpen && (
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-[1px] md:hidden"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Menú móvil (acordeón) */}
          <div
            id="mobile-menu"
            ref={menuRef}
            style={{ maxHeight }}
            className="md:hidden overflow-hidden transition-[max-height] duration-500 ease-in-out bg-[#191410] relative"
          >
            <div className="px-4 pb-6 pt-4 space-y-3">
              {Menu.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.link}
                  className={({ isActive }) =>
                    [
                      "block text-lg font-medium px-3 py-2 rounded-lg transition-colors",
                      isActive
                        ? "bg-[#FAEAD7] text-[#191410]"
                        : "text-[#FAEAD7] hover:text-[#AC9484] hover:bg-white/5",
                    ].join(" ")
                  }
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </NavLink>
              ))}

              {/* Carrito en móvil */}
              <div className="pt-2">
                <CartButton
                  onClick={() => {
                    openCart();
                    setIsOpen(false);
                  }}
                  count={count}
                  className="w-full justify-center"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
