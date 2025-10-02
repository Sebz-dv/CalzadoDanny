import React from "react";
import ReactDOM from "react-dom/client";
import AuthProvider from "./context/AuthProvider.jsx";
import RouteLoadingProvider from "./context/RouteLoadingProvider.jsx";
import { BrowserRouter } from "react-router-dom";
import { CartProvider } from "./context/cart/cart-context.jsx";
import App from "./App";
import "./index.css";
import CartModal from "./components/car/CartModal.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CartProvider>
      <BrowserRouter>
        <RouteLoadingProvider>
          <AuthProvider>
            <App />
            <CartModal />
          </AuthProvider>
        </RouteLoadingProvider>
      </BrowserRouter>
    </CartProvider>
  </React.StrictMode>
);
