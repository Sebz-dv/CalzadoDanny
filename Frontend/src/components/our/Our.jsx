import React from "react";
import Marca from "../../assets/website/marca.jpg";

const AboutBrand = () => {
  return (
    <section
      id="about"
      className="py-16 bg-[#FAEAD7] transition-colors duration-300"
      aria-labelledby="about-heading"
    >
      <div className="container mx-auto px-6 max-w-7xl flex flex-col md:flex-row items-center gap-12">
        {/* Imagen */}
        <div data-aos="fade-right" className="flex-shrink-0 w-full md:w-1/2">
          <img
            src={Marca}
            alt="Tecnología e inclusión"
            className="rounded-xl shadow-lg object-cover w-full h-[320px]"
            loading="lazy"
          />
        </div>

        {/* Texto */}
        <div
          data-aos="fade-left"
          className="w-full md:w-1/2 text-center md:text-left"
        >
          <h2
            id="about-heading"
            className="text-4xl font-extrabold text-[#191410] mb-4"
          >
            Calzado Danny - Desde 1974
          </h2>
          <p className="text-[#48331E] text-lg leading-relaxed font-semibold mb-6">
            Calzado y accesorios femeninos con tradición y elegancia. Desde
            1974, creamos zapatos cómodos y duraderos que realzan el estilo de
            cada mujer y son elaborados en 100% cuero. Inspirados en la belleza
            clásica, hechos para lucir única y con confianza.
          </p>

          {/* Botón Ver más */}
          <a
            href="/about" // o la ruta que uses
            className="inline-block bg-[#AC9484] text-white font-semibold px-6 py-3 rounded-full shadow hover:bg-[#947c6e] transition duration-300 focus:outline-none focus:ring-2 focus:ring-[#AC9484] focus:ring-offset-2"
          >
            Ver más
          </a>
        </div>
      </div>
    </section>
  );
};

export default AboutBrand;
