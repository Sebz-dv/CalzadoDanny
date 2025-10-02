// src/services/checkoutService.js
import { api } from "../../lib/api";

export function sendCheckout(payload) {
  return api.post("/checkout", payload);
}
