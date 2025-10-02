import React from "react";
import Carrusel from "../../components/carrusel/Carrusel";
import Categories from "../../components/categories/Categories";
import Our from "../../components/our/Our";
import { CartProvider } from "../../context/cart/cart-context";
import CartModal from "../../components/car/CartModal";
import CartFab from "../../components/car/CartFab"; 

export default function Index() {
  return (
    <CartProvider>
      <Carrusel />
      <Categories />
      <Our /> 
      <CartModal />
      <CartFab />
    </CartProvider>
  );
}
