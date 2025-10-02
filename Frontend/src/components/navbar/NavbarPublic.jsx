import React, { useState, useRef, useEffect } from "react";
import CartButton from "../Carbutton/CartButton";
import { IoMdSearch } from "react-icons/io";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import Logo from "../../assets/logo.png";
import { useCart } from "../../context/cart/cart-context"; // ← importa el contexto

const Navbar = ({ handleOrderPopup }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const [maxHeight, setMaxHeight] = useState("0px");

  // Carrito (contexto)
  const { openCart, count } = useCart(); // ← usar openCart para abrir, count para badge

  // Actualiza max-height para animar slide
  useEffect(() => {
    if (isOpen && menuRef.current) {
      setMaxHeight(menuRef.current.scrollHeight + "px");
    } else {
      setMaxHeight("0px");
    }
  }, [isOpen]);

  const Menu = [
    { id: 1, name: "Inicio", link: "/" },
    { id: 2, name: "Nosotros", link: "/about" },
    { id: 3, name: "Tienda", link: "/shop" },
    { id: 4, name: "Contacto", link: "/contact" },
  ];

  return (
    <nav className="shadow-lg bg-[#191410] text-[#FAEAD7] relative z-40">
      {/* Banner Superior */}
      <div className="bg-gradient-to-r from-[#48331E] to-[#AC9484] text-[#FAEAD7] text-lg sm:text-xl px-4 py-2 text-center tracking-[0.25em] font-bold shadow-md drop-shadow-lg">
        - D e s d e - 1 9 7 4 -
      </div>

      {/* Navbar Contenido */}
      <div className="py-2 border-t border-[#48331E]">
        <div className="container mx-auto px-4">
          {/* Contenedor flex para logo y hamburguesa en móvil, menú en desktop */}
          <div className="flex items-center justify-between md:justify-start md:gap-12 min-h-[64px]">
            {/* Logo */}
            <div className="flex-shrink-0">
              {Logo ? (
                <a href="/" aria-label="Inicio">
                  <img
                    src={Logo}
                    alt="Logo"
                    className="h-16 object-contain"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </a>
              ) : (
                <a
                  href="/"
                  className="text-2xl font-bold text-[#FAEAD7]"
                  aria-label="Inicio"
                >
                  Danny's
                </a>
              )}
            </div>

            {/* Menú desktop */}
            <ul className="hidden md:flex flex-grow justify-center items-center gap-6">
              {Menu.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.link}
                    className="px-3 py-2 font-medium text-[#ffffff] hover:text-[#FAEAD7] hover:underline transition-all duration-200"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>

            {/* Botones derecha */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative group hidden sm:block">
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  className="w-[180px] group-hover:w-[250px] pl-4 pr-10 py-2 rounded-full bg-[#FAEAD7] text-[#191410] border border-[#AC9484] focus:outline-none focus:ring-2 focus:ring-[#AC9484]/50 transition-all duration-300"
                />
                <IoMdSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#AC9484] group-hover:text-[#48331E] transition-colors duration-200" />
              </div>

              {/* Botón Carrito (abre modal al click) */}
              <CartButton onClick={openCart} count={count} />

              {/* Botón Hamburguesa móvil */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden text-[#FAEAD7] text-3xl p-2 focus:outline-none"
                aria-label="Abrir menú"
                aria-expanded={isOpen}
              >
                {isOpen ? <HiOutlineX /> : <HiOutlineMenu />}
              </button>
            </div>
          </div>

          {/* Menú móvil desplegable animado */}
          <div
            ref={menuRef}
            style={{ maxHeight }}
            className="md:hidden overflow-hidden transition-[max-height] duration-500 ease-in-out bg-[#191410] px-4"
          >
            <div className="flex flex-col py-6 space-y-4">
              {Menu.map((item) => (
                <a
                  key={item.id}
                  href={item.link}
                  className="block text-lg font-medium text-[#FAEAD7] hover:text-[#AC9484] transition-colors duration-200"
                  onClick={() => setIsOpen(false)} // cerrar menú al click
                >
                  {item.name}
                </a>
              ))}

              {/* Cart también disponible en el menú móvil */}
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
};

export default Navbar;
