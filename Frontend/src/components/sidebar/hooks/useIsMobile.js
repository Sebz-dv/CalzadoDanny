// src/components/sidebar/hooks/useIsMobile.js
import { useEffect, useState } from "react";

export function useIsMobile(breakpoint = 1024) {
  const getInitial = () => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < breakpoint;
  };

  const [isMobile, setIsMobile] = useState(getInitial);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}
