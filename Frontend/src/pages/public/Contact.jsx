import React, { useState } from "react";
import { sendContact } from "../../services/contact/contactService";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState({ sending: false, ok: null, msg: "" });

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus({ sending: true, ok: null, msg: "" });
    try {
      const res = await sendContact(form);
      setStatus({ sending: false, ok: true, msg: res.message });
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      // Si quieres resaltar errores por campo: err.fieldErrors?.name, etc.
      setStatus({
        sending: false,
        ok: false,
        msg: err?.message ?? "Error al enviar.",
      });
    }
  };

  return (
    <section className="bg-[#FAEAD7] text-[#48331E] py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-extrabold mb-4">Contáctanos</h2>
        <p className="text-lg font-medium mb-10">
          ¿Tienes dudas, comentarios o simplemente quieres saludarnos?
          ¡Escríbenos!
        </p>

        <form
          onSubmit={onSubmit}
          className="bg-white shadow-md rounded-lg p-8 space-y-6 text-left"
        >
          <div>
            <label htmlFor="name" className="block text-sm font-semibold mb-1">
              Nombre completo
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C59C5C]"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-1">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C59C5C]"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-semibold mb-1"
            >
              Mensaje
            </label>
            <textarea
              id="message"
              name="message"
              rows="5"
              required
              value={form.message}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-[#C59C5C]"
            />
          </div>

          <button
            type="submit"
            disabled={status.sending}
            className="bg-[#191410] text-white px-6 py-2 rounded-md hover:bg-[#3c2e22] transition-colors disabled:opacity-60"
          >
            {status.sending ? "Enviando…" : "Enviar mensaje"}
          </button>
          {status.ok === true && (
            <p className="text-green-700 text-sm mt-2">{status.msg}</p>
          )}
          {status.ok === false && (
            <p className="text-red-700 text-sm mt-2">{status.msg}</p>
          )}
        </form>
      </div>
    </section>
  );
}
