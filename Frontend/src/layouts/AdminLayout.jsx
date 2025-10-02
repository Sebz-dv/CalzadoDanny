// layouts/IntroLayout.jsx
import React, { useState } from "react";
import Navbar from "../components/navbar/Navbar.jsx";
import Sidebar from "../components/sidebar/Sidebar.jsx";

export default function IntroLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-bg text-foreground flex flex-row">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Navbar onMenuClick={() => setSidebarOpen((p) => !p)} />
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
