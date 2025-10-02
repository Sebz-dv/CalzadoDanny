import footerLogo from "../../assets/logoBlack.png";
import Banner from "../../assets/website/footer-pattern.png";
import {
  FaFacebook,
  FaInstagram,
  FaLocationArrow,
} from "react-icons/fa";

const bannerStyle = {
  backgroundImage: `url(${Banner.src})`,
  backgroundPosition: "bottom",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
  backgroundColor: "#FFFFFFFF",
};

const FooterLinks = [
  { title: "Inicio", href: "/#" },
  { title: "Nosotros", href: "/about" },
  { title: "Tienda", href: "/about" },
  { title: "Contacto", href: "/contact" },
];

const CompanyInfo = () => (
  <div className="py-8 px-6 text-center md:text-left flex flex-col items-center md:items-start">
    <img src={footerLogo} alt="Calzado Danny Logo" className="w-64 h-28" />
    <p className="max-w-xs text-[#191410] leading-relaxed font-light tracking-wide">
      Calidad, comodidad y estilo que te acompañan en cada paso.
    </p>
  </div>
);

const NavLinks = ({ links, title }) => (
  <div className="py-8 px-6">
    <h3 className="text-xl font-semibold mb-6 text-[#48331E]">{title}</h3>
    <ul className="space-y-3">
      {links.map(({ title, href }) => (
        <li key={title}>
          <a
            href={href}
            className="text-[#AC9484] hover:text-[#48331E] transition duration-300 ease-in-out flex items-center gap-2"
          >
            <span className="w-1 h-1 rounded-full bg-[#48331E] inline-block" />
            {title}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const ContactInfo = () => (
  <div className="py-8 px-6">
    <div className="flex gap-6 text-3xl text-[#48331E] mb-8 justify-center md:justify-start">
      <a
        href="https://www.instagram.com/calzadodannyoficial?igsh=MWh4bGlycncyeDI1OA%3D%3D&utm_source=qr"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="hover:text-[#191410] transition-colors"
      >
        <FaInstagram />
      </a>
      <a
        href="https://www.facebook.com/share/1P12WYJoGk/?mibextid=wwXIfr"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook"
        className="hover:text-[#191410] transition-colors"
      >
        <FaFacebook />
      </a>
    </div>

    <div className="space-y-5 text-[#AC9484] font-medium text-sm md:text-base max-w-xs mx-auto md:mx-0">
      {/* Unicentro Cali */}
      <div className="flex items-start gap-3">
        <FaLocationArrow className="text-[#48331E] mt-1" />
        <div>
          <strong>Unicentro Cali</strong>
          <br />
          <a
            href="https://www.google.com/maps/place/Centro+Comercial+Unicentro,+Cra.+100+%235-169"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Cra. 100 #5-169, Pasillo 4 Local 275
          </a>
          <br />
          WhatsApp:
          <a
            href="https://wa.me/573116321423"
            target="_blank"
            rel="noopener noreferrer"
            className="underline ml-1"
          >
            3116321423
          </a>
          /
          <a
            href="https://wa.me/573156324046"
            target="_blank"
            rel="noopener noreferrer"
            className="underline ml-1"
          >
            3156324046
          </a>
        </div>
      </div>

      {/* Centenario Cali */}
      <div className="flex items-start gap-3">
        <FaLocationArrow className="text-[#48331E] mt-1" />
        <div>
          <strong>Centenario Cali</strong>
          <br />
          <a
            href="https://www.google.com/maps/place/Centro+Comercial+Centenario"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Av. 4 Nte. #7N-46, Granada, Local 122
          </a>
          <br />
          WhatsApp:
          <a
            href="https://wa.me/573152565200"
            target="_blank"
            rel="noopener noreferrer"
            className="underline ml-1"
          >
            3152565200
          </a>
        </div>
      </div>
    </div>
  </div>
);

const Footer = () => {
  return (
    <footer style={bannerStyle} className="text-[#191410]">
      <div className="container mx-auto px-6 max-w-7xl">
        <div
          data-aos="zoom-in"
          className="grid grid-cols-1 md:grid-cols-3 gap-12 py-16"
        >
          <CompanyInfo />
          <NavLinks links={FooterLinks} title="Enlaces Importantes" />
          <ContactInfo />
        </div>

        <div className="border-t border-[#AC9484] pt-6 pb-8 text-center text-[#48331E] text-sm select-none font-light">
          © {new Date().getFullYear()} Calzado Danny. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
