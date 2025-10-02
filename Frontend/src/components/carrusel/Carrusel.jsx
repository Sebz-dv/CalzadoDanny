import React from "react";
import Image1 from "../../assets/hero/women.png";
import Image2 from "../../assets/hero/shopping.png";
import Image3 from "../../assets/hero/sale.png";
import Slider from "react-slick";

// Slick estilos
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const slides = [
  { id: 1, image: Image1 },
  { id: 2, image: Image2 },
  { id: 3, image: Image3 },
];

// Flechas personalizadas
const NextArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/60 text-white p-3 rounded-full hover:bg-black transition-all duration-300"
    aria-label="Siguiente slide"
  >
    <span className="text-xl">▶</span>
  </button>
);

const PrevArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/60 text-white p-3 rounded-full hover:bg-black transition-all duration-300"
    aria-label="Slide anterior"
  >
    <span className="text-xl">◀</span>
  </button>
);

const sliderSettings = {
  dots: false,
  arrows: true,
  nextArrow: <NextArrow />,
  prevArrow: <PrevArrow />,
  infinite: true,
  speed: 800,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 4000,
  cssEase: "ease-in-out",
  pauseOnHover: false,
  pauseOnFocus: true,
  responsive: [
    {
      breakpoint: 1024, // tablet
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
      },
    },
    {
      breakpoint: 640, // móvil
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false, // quita flechas en móvil para no tapar imagen
        dots: true,
      },
    },
  ],
};

const Carrusel = () => {
  return (
    <section className="relative w-full h-[70vh] md:h-[85vh] lg:h-screen overflow-hidden">
      <Slider {...sliderSettings}>
        {slides.map(({ id, image }) => (
          <div
            key={id}
            className="relative w-full h-[70vh] md:h-[85vh] lg:h-screen flex justify-center items-center"
          >
            <img
              src={image}
              alt={`Slide ${id}`}
              className="w-full h-full object-cover select-none"
              draggable="false"
            />
          </div>
        ))}
      </Slider>
    </section>
  );
};

export default Carrusel;
