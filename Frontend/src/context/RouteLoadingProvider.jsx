import React, { useMemo, useState } from "react";
import { RouteLoadingContext } from "./route-loading-context";

export default function RouteLoadingProvider({ children }) {
  const [routeLoading, setRouteLoading] = useState(false);
  const value = useMemo(() => ({ routeLoading, setRouteLoading }), [routeLoading]);
  return <RouteLoadingContext.Provider value={value}>{children}</RouteLoadingContext.Provider>;
}
