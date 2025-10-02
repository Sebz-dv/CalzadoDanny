import { useContext } from "react";
import { RouteLoadingContext } from "../context/route-loading-context";

export function useRouteLoading() {
  const ctx = useContext(RouteLoadingContext);
  if (!ctx) throw new Error("useRouteLoading must be used within RouteLoadingProvider");
  return ctx;
}
