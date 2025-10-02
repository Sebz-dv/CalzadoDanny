// src/components/sidebar/data/menuItems.js
import { FaHome, FaCog, FaImage  } from "react-icons/fa";

export const menuItems = [
  {
    key: "inicio",
    label: "Inicio",
    link: "/dashboard",
    icon: FaHome, 
  },
  {
    key: "carrusel",
    label: "Carrusel",
    link: "/carrusel",
    icon: FaImage , 
  },
  {
    key: "ajustes",
    label: "Ajustes",
    icon: FaCog, 
    children: [
      {
        key: "general",
        label: "General",
        icon: FaCog,
        link: "/pages/perfil",
      },
    ],
  },
];
