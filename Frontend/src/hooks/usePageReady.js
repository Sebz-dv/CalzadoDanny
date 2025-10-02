import { useEffect, useState } from "react";
import { useRouteLoading } from "../hooks/useRouteLoading.js";

export default function usePageReady() {
  const { setRouteLoading } = useRouteLoading();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let t = setTimeout(() => {
      setRouteLoading(false); // la página ya montó → quita overlay
      setReady(true); // activa clases de animación
    }, 80); // micro-delay para que se note suave
    return () => clearTimeout(t);
  }, [setRouteLoading]);

  const className = `transition-all duration-300 ${
    ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
  }`;
  return { ready, className };
}
