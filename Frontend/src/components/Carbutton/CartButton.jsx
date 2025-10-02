import { FaCartShopping } from "react-icons/fa6";

const CartButton = ({ onClick, count = 0, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`relative bg-[#48331E] text-[#fff] py-2 px-4 rounded-full flex items-center gap-2 hover:bg-[#af7861] transition-all duration-200 shadow-md ${className}`}
      aria-label="Abrir carrito"
    >
      <span className="hidden sm:inline">Carrito</span>
      <FaCartShopping className="text-xl" />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-[#e11d48] text-white text-[10px] flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  );
};

export default CartButton;
