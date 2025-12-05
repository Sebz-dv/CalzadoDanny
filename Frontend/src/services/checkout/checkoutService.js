// src/services/checkout/checkoutService.js
import { api } from "../../lib/api";

export async function sendCheckout(payload) {
  const resp = await api.post("/checkout", payload);
  return resp.data; // { ok, order_code, payment_url, ... }
}
