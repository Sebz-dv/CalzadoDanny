// App.jsx
import React from "react";
import { Routes, Route, Outlet, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import AppLayout from "./layouts/AppLayout"; // público
import AdminLayout from "./layouts/AdminLayout"; // privado
import Index from "./pages/public/index";
import Carrusel from "./pages/admin/Carrusel";
import { useAuth } from "./context/useAuth";
import CategoriesPage from "./pages/admin/CategoriesPage";
import ProductsPage from "./components/products/ProductsPage";
import About from "./pages/public/About";
import CategoryBrowse from "./components/categories/CategoryBrowse";
import { CartProvider } from "./context/cart/cart-context";
import CartModal from "./components/car/CartModal";
import CarToast from "./components/car/CartToast";  
import ProductsBrowse from "./components/products/ProductsBrowse";
import Contact from "./pages/public/Contact";


// --------- Shells ---------
function PublicShell() {
  return (
    <CartProvider>
      <AppLayout>
        <Outlet />
      </AppLayout> 
      <CartModal />
      <CarToast/>
    </CartProvider>
  );
}

function AdminShell() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

// --------- Ruta protegida ---------
function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      {/* PÚBLICAS */}
      <Route element={<PublicShell />}>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} /> 
        <Route path="/shop" element={<ProductsBrowse  />} /> 
        <Route path="/categories/:slug" element={<CategoryBrowse />} /> 
        <Route path="/contact" element={<Contact />} />
      </Route>

      <Route path="/login" element={<Login />} />

      {/* PRIVADAS */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dash/carrusel" element={<Carrusel />} />
          <Route path="/dash/categories" element={<CategoriesPage />} />
          <Route path="/dash/products" element={<ProductsPage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<div className="p-6">404</div>} />
    </Routes>
  );
}
