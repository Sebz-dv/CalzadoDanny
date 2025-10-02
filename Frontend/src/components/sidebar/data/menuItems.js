// src/components/sidebar/data/menuItems.js
import {
  FaHome,
  FaCog,
  FaImage,
  FaGripHorizontal,
  FaProductHunt,
} from "react-icons/fa";

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
    link: "/dash/carrusel",
    icon: FaImage,
  },
  {
    key: "categories",
    label: "Categorias",
    link: "/dash/categories",
    icon: FaGripHorizontal,
  },
  {
    key: "products",
    label: "Productos",
    link: "/dash/products",
    icon: FaProductHunt,
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
