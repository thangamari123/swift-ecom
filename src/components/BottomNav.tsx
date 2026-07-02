import { Link, useLocation } from "react-router-dom";
import { Heart, ShoppingCart, User, Film } from "lucide-react";
import { useStore } from "@/lib/store";

export function BottomNav() {
  const location = useLocation();
  const { cart, wishlist } = useStore();
  const cartCount = (cart || []).reduce((sum: number, item: any) => sum + item.quantity, 0);
  const wishlistCount = (wishlist || []).length;

  const path = location.pathname;

  const isActive = (href: string) => {
    if (href === "/") return path === "/";
    return path.startsWith(href);
  };

  const tabClass = (href: string) =>
    `flex flex-col items-center transition-colors ${
      isActive(href) ? "text-blue-600" : "text-slate-400 hover:text-slate-700"
    }`;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50">
      {/* Home */}
      <Link to="/" className={tabClass("/")}>
        <svg className="w-6 h-6 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span className="text-[10px] font-semibold">Home</span>
      </Link>

      {/* Shop */}
      <Link to="/shop" className={tabClass("/shop")}>
        <svg className="w-6 h-6 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <span className="text-[10px] font-semibold">Shop</span>
      </Link>

      {/* Reels */}
      <Link to="/reels" className={tabClass("/reels")}>
        <Film className="w-6 h-6 mb-0.5" />
        <span className="text-[10px] font-semibold mt-0.5">Reels</span>
      </Link>

      {/* Wishlist */}
      <Link to="/wishlist" className={tabClass("/wishlist")}>
        <div className="relative">
          <Heart className="w-6 h-6 mb-0.5" />
          {wishlistCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {wishlistCount > 9 ? "9+" : wishlistCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-semibold mt-0.5">Wishlist</span>
      </Link>

      {/* Cart */}
      <Link to="/cart" className={tabClass("/cart")}>
        <div className="relative">
          <ShoppingCart className="w-6 h-6 mb-0.5" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-semibold mt-0.5">Cart</span>
      </Link>

      {/* Profile */}
      <Link to="/account" className={tabClass("/account")}>
        <User className="w-6 h-6 mb-0.5" />
        <span className="text-[10px] font-semibold">Profile</span>
      </Link>
    </div>
  );
}
