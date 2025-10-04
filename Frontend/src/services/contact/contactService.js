import { api } from "../../lib/api";

export async function sendContact(payload) {
  try {
    const { data } = await api.post("/contact", payload, { withCredentials: false });
    return {
      ok: !!data?.ok,
      message: data?.message ?? "Mensaje enviado",
    };
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "No se pudo enviar el mensaje.";
    // Si Laravel manda errores por campo:
    const fieldErrors = err?.response?.data?.errors || null;
    throw { message: msg, fieldErrors };
  }
}