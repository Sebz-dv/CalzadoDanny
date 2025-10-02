// src/components/home/Carrusel.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Slider from "react-slick";
import { listPublicSlides } from "../../services/carrusel/slidesService.js";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// === Flechas personalizadas (glass) ===
const IconChevronRight = (props) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d="M9 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IconChevronLeft = (props) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d="M15 18l-6-6 6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const NextArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    className={[
      "group absolute right-4 top-1/2 -translate-y-1/2 z-30",
      "rounded-full backdrop-blur bg-black/30 text-white",
      "p-3 shadow-lg border border-white/10",
      "transition-all duration-300 hover:bg-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
    ].join(" ")}
    aria-label="Siguiente"
  >
    <IconChevronRight className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-0.5" />
  </button>
);

const PrevArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    className={[
      "group absolute left-4 top-1/2 -translate-y-1/2 z-30",
      "rounded-full backdrop-blur bg-black/30 text-white",
      "p-3 shadow-lg border border-white/10",
      "transition-all duration-300 hover:bg-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
    ].join(" ")}
    aria-label="Anterior"
  >
    <IconChevronLeft className="w-6 h-6 transition-transform duration-300 group-hover:-translate-x-0.5" />
  </button>
);

export default function Carrusel() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0); // 0–100
  const sliderRef = useRef(null);

  // === Opciones de animación/UX ===
  const AUTOPLAY_MS = 5000; // ajusta si quieres más/menos tiempo por slide
  const TRANSITION_MS = 750;

  const sliderSettings = useMemo(
    () => ({
      dots: true, // mostramos dots pero los ocultamos en desktop vía CSS
      arrows: true,
      nextArrow: <NextArrow />,
      prevArrow: <PrevArrow />,
      infinite: true,
      speed: TRANSITION_MS,
      slidesToShow: 1,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: AUTOPLAY_MS,
      cssEase: "ease-in-out",
      pauseOnHover: false,
      pauseOnFocus: true,
      adaptiveHeight: false,
      swipeToSlide: true,
      touchMove: true,
      beforeChange: (_, next) => {
        setCurrent(next);
        setProgress(0);
      },
      afterChange: () => {
        // reinicia la barra al cambiar
        setProgress(0);
      },
      responsive: [
        {
          breakpoint: 640,
          settings: {
            arrows: false,
            dots: true,
          },
        },
      ],
      appendDots: (dots) => (
        <div>
          <ul className="slick-dots !bottom-4 !mb-0"> {dots} </ul>
        </div>
      ),
      customPaging: () => (
        <button
          className="w-2.5 h-2.5 rounded-full bg-white/50 hover:bg-white/80 focus:outline-none"
          aria-label="Ir al slide"
        />
      ),
    }),
    []
  );

  // === Timer para la barra de progreso (sin depender del interno de slick) ===
  useEffect(() => {
    if (!slides.length) return;
    setProgress(0);
    const step = 100 / (AUTOPLAY_MS / 50); // 50ms por tick
    const id = setInterval(() => {
      setProgress((p) => {
        const np = p + step;
        return np >= 100 ? 100 : np;
      });
    }, 50);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, slides.length]);

  // === Carga de slides ===
  useEffect(() => {
    (async () => {
      try {
        const data = await listPublicSlides();
        const clean = (data || [])
          .filter((s) => s?.image_url)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        setSlides(clean);
      } catch (e) {
        console.error("Error cargando slides públicos:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <section className="relative w-full h-[70vh] md:h-[85vh] lg:h-screen overflow-hidden bg-muted">
        {/* Skeleton con brillo diagonal */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/5 animate-pulse" />
      </section>
    );
  }

  if (!slides.length) {
    return null;
  }

  return (
    <section className="relative w-full h-[70vh] md:h-[85vh] lg:h-screen overflow-hidden">
      {/* Barra de progreso superior */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-1 bg-black/20 z-30">
        <div
          className="h-full bg-white/90 transition-[width] duration-75"
          style={{ width: `${progress}%` }}
          aria-hidden="true"
        />
      </div>

      {/* Sombra suave en bordes para dar profundidad sin “bordes” */}
      <div className="pointer-events-none absolute inset-0 z-10 [box-shadow:inset_0_0_80px_rgba(0,0,0,0.35)]" />

      <Slider ref={sliderRef} {...sliderSettings}>
        {slides.map((s, idx) => (
          <div
            key={s.id}
            className="relative w-full h-[70vh] md:h-[85vh] lg:h-screen"
          >
            {/* Imagen con picture + blur-up + Ken Burns */}
            <div
              className={[
                "absolute inset-0 will-change-transform",
                "motion-safe:transition-transform",
                // Zoom suave solo si está activo el slide
                idx === current
                  ? "motion-safe:duration-[5000ms] motion-safe:scale-105"
                  : "motion-safe:scale-100",
              ].join(" ")}
            >
              <picture>
                {s.mobile_image_url && (
                  <source
                    media="(max-width: 640px)"
                    srcSet={s.mobile_image_url}
                  />
                )}
                <img
                  src={s.image_url}
                  alt={s.alt || s.title || `Slide ${s.id}`}
                  className={[
                    "w-full h-full object-cover object-center select-none",
                    // Blur-up mientras carga
                    "opacity-0 data-[loaded=true]:opacity-100 transition-opacity duration-700",
                  ].join(" ")}
                  draggable="false"
                  loading="lazy"
                  onLoad={(e) =>
                    e.currentTarget.setAttribute("data-loaded", "true")
                  }
                  onError={(e) => {
                    console.warn(
                      "IMG ERROR src=",
                      e.currentTarget.src,
                      " slide=",
                      s
                    );
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              </picture>
            </div>

            {/* Overlay de gradientes para legibilidad del caption */}
            {/* <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent z-10 pointer-events-none" /> */}

            {/* Caption */}
            {/* {(s.title || s.caption || (s.button_text && s.button_url)) && (
              <div className="absolute inset-x-0 bottom-0 z-20 px-6 md:px-10 pb-8 md:pb-12">
                <div className="max-w-3xl text-white drop-shadow">
                  {s.title && (
                    <h3 className="text-2xl md:text-5xl font-semibold leading-tight tracking-tight">
                      {s.title}
                    </h3>
                  )}
                  {s.caption && (
                    <p className="mt-3 md:mt-4 text-sm md:text-lg/7 opacity-95">
                      {s.caption}
                    </p>
                  )}
                  {s.button_text && s.button_url && (
                    <a
                      href={s.button_url}
                      className={[
                        "inline-flex mt-4 items-center gap-2",
                        "rounded-full px-5 py-2.5",
                        "bg-white/90 text-black font-medium",
                        "backdrop-blur border border-white/20 shadow",
                        "transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                      ].join(" ")}
                    >
                      {s.button_text}
                      <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </div>
              </div>
            )} */}
          </div>
        ))}
      </Slider>

      {/* Accesibilidad: controles rápidos (opcional) */}
      <div className="sr-only" aria-live="polite">
        Slide {current + 1} de {slides.length}
      </div>

      {/* Estilos de dots: escondidos en desktop, visibles en móvil */}
      <style>{`
        /* Dots base */
        .slick-dots li { margin: 0 6px; }
        .slick-dots li button:before { content: none; } /* quitamos el pseudo-elemento por defecto */
        .slick-dots li.slick-active button {
          outline: none;
        }
        /* Solo en móvil mostramos los dots */
        @media (min-width: 641px) {
          .slick-dots { display: none !important; }
        }
      `}</style>
    </section>
  );
}
