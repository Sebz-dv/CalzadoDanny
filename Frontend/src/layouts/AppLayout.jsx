import React from "react";
import NavbarPublic from "../components/navbar/NavbarPublic.jsx";
import Footer from "../components/footer/Footer.jsx";

export default function AppLayout({ children }) {
  return (
    <div className="min-h-dvh bg-bg text-foreground flex flex-row">
      <div className="flex-1 min-w-0 flex flex-col">
        <NavbarPublic />
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
