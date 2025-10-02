import React from "react";
import PropTypes from "prop-types";

function SidebarItem({
  active = false,
  icon: Icon = null,  // puede venir como componente (referencia) o elemento ya instanciado
  label = "",
  onClick,
  sidebarOpen = true,
  role = "button",
  tabIndex = 0,
  children, // para chevron u otros adornos a la derecha
}) {
  // Soportar ambos casos:
  // - icon: FaHome          -> typeof Icon === "function"
  // - icon: <FaHome />      -> React.isValidElement(Icon) === true
  const IconNode =
    Icon
      ? (typeof Icon === "function"
          ? <Icon className="text-lg mr-2" />
          : (React.isValidElement(Icon)
              ? React.cloneElement(Icon, { className: ["text-lg mr-2", Icon.props?.className].filter(Boolean).join(" ") })
              : null))
      : null;

  return (
    <div
      role={role}
      tabIndex={tabIndex}
      aria-current={active}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={[
        "relative cursor-pointer p-2 rounded transition-colors select-none",
        "hover:bg-foreground/10",
        sidebarOpen ? "flex items-center" : "flex justify-center",
      ].join(" ")}
      style={{
        borderLeft: active ? "4px solid #eab308" : "4px solid transparent",
        background: active
          ? "color-mix(in oklab, rgb(var(--foreground)) 10%, transparent)"
          : "transparent",
        transition: "border-color 0.2s, background 0.2s",
      }}
    >
      {IconNode}
      {sidebarOpen && <span className="flex-1">{label}</span>}
      {/* si pasas children (ej: <FaAngleDown />) lo pintamos al final */}
      {sidebarOpen && children ? <span className="ml-auto">{children}</span> : null}
    </div>
  );
}

SidebarItem.propTypes = {
  active: PropTypes.bool,
  // acepta referencia o elemento
  icon: PropTypes.oneOfType([PropTypes.elementType, PropTypes.node]),
  label: PropTypes.string,
  onClick: PropTypes.func,
  sidebarOpen: PropTypes.bool,
  role: PropTypes.string,
  tabIndex: PropTypes.number,
  children: PropTypes.node,
};

export default SidebarItem;
