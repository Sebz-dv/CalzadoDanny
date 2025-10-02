import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import marca from "../../assets/website/marca.jpg";

// Fix para íconos
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});

const locations = [
  {
    city: "Cali",
    name: "Centro Comercial Unicentro - Cali",
    address: "Cra. 100 #5-169",
    coords: [3.3728264185676093, -76.53916192767603],
    schedule: `
      Pasillo 4 local 275<br/>
      WhatsApp: <a href="https://wa.me/573116321423" target="_blank" rel="noopener noreferrer">3116321423</a> / 
      <a href="https://wa.me/573156324046" target="_blank" rel="noopener noreferrer">3156324046</a><br/> 
    `,
    mapLink: "https://www.google.com/maps/place/Centro+Comercial+Unicentro,+Cra.+100+%235-169",
  },
  {
    city: "Cali",
    name: "Centro Comercial Centenario - Cali",
    address: "Av. 4 Nte. #7N-46, Granada",
    coords: [3.454195802138638, -76.53679765961681],
    schedule: `
      Local 122<br/>
      WhatsApp: <a href="https://wa.me/573152565200" target="_blank" rel="noopener noreferrer">3152565200</a>
    `,
    mapLink: "https://www.google.com/maps/place/Centro+Comercial+Centenario",
  },
];

const uniqueCities = [...new Set(locations.map((l) => l.city))];

function ChangeView({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds?.length) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

export default function Nosotros() {
  const [selectedCity, setSelectedCity] = useState("Bogotá");

  const cityLocations = locations.filter((loc) => loc.city === selectedCity);
  const bounds = cityLocations.map((loc) => loc.coords);

  return (
    <section className="bg-[#FAEAD7] text-[#48331E]">
      {/* Historia */}
      <div className="py-16 container mx-auto px-6 max-w-7xl flex flex-col md:flex-row items-center gap-12">
        <div className="w-full md:w-1/2">
          <img
            src={marca}
            alt="Historia de la marca"
            className="rounded-xl shadow-lg object-cover w-full h-[340px]"
          />
        </div>
        <div className="w-full md:w-1/2 text-center md:text-left">
          <h2 className="text-4xl font-extrabold text-[#191410] mb-4">
            Nuestra historia
          </h2>
          <p className="text-lg leading-relaxed font-semibold mb-6">
            Desde 1974, Calzado Danny ha sido sinónimo de elegancia, comodidad y
            tradición. Elaboramos calzado femenino 100% en cuero, fusionando
            diseño clásico con una confección cuidadosa. Nuestra pasión es
            hacerte sentir segura, auténtica y cómoda a cada paso.
          </p>
        </div>
      </div>

      {/* Misión y Visión */}
      <div className="bg-[#F3DBC0] py-16 px-6">
        <div className="container mx-auto max-w-6xl grid md:grid-cols-2 gap-12 text-center md:text-left">
          <div>
            <h3 className="text-2xl font-bold text-[#2c1b0c] mb-4">Nuestra Misión</h3>
            <p className="text-base font-medium">
              Crear calzado femenino de alta calidad que combine diseño, confort
              y durabilidad, promoviendo el trabajo artesanal colombiano.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-[#2c1b0c] mb-4">Nuestra Visión</h3>
            <p className="text-base font-medium">
              Ser la marca de calzado líder en Colombia reconocida por su
              tradición, estilo y compromiso con la sostenibilidad.
            </p>
          </div>
        </div>
      </div>

      {/* Ubicación con mapa */}
      <div className="py-16 px-6">
        <div className="container mx-auto max-w-6xl text-center">
          <h3 className="text-3xl font-extrabold text-[#191410] mb-8">
            Encuentra nuestras tiendas
          </h3>
          <p className="text-lg font-medium mb-6">
            Visítanos en cualquiera de nuestras sucursales físicas en Bogotá,
            Medellín, Cali y más.
          </p>

          {/* Botones de ciudades */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {uniqueCities.map((city, i) => (
              <button
                key={i}
                className={`px-4 py-2 rounded-full border ${
                  selectedCity === city
                    ? "bg-[#191410] text-white"
                    : "bg-white text-[#191410] hover:bg-[#f5e6ce]"
                } transition-colors duration-200`}
                onClick={() => setSelectedCity(city)}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Mapa */}
          <div className="w-full h-[400px] rounded-xl overflow-hidden">
            <MapContainer
              center={cityLocations[0]?.coords || [4.6, -74.07]}
              zoom={13}
              scrollWheelZoom={false}
              className="w-full h-full"
            >
              <ChangeView bounds={bounds} />
              <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {cityLocations.map((loc, idx) => (
                <Marker position={loc.coords} key={idx}>
                  <Popup>
                    <div className="text-sm">
                      <strong>{loc.name}</strong>
                      <br />
                      {loc.address}
                      <br />
                      <em dangerouslySetInnerHTML={{ __html: loc.schedule }} />
                      <br />
                      <a
                        href={loc.mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline mt-1 inline-block"
                      >
                        Cómo llegar
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
