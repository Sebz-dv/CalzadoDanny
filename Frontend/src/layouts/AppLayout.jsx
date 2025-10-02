import React from "react";
import NavbarPublic from "../components/navbar/NavbarPublic.jsx";

export default function AppLayout({ children }) {
  return (
    <div className="min-h-dvh bg-bg text-foreground flex flex-row">
      <div className="flex-1 min-w-0 flex flex-col">
        <NavbarPublic />
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
