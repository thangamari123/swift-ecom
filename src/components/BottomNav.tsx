import { Link, useLocation } from "react-router-dom";
import { Compass, Store, PlaySquare, Heart, ShoppingBag, UserCircle2 } from "lucide-react";
import { useStore } from "@/lib/store";

export function BottomNav() {
  const location = useLocation();
  const { cart, wishlist } = useStore();
  const cartCount = (cart || []).reduce((sum: number, item: any) => sum + item.quantity, 0);
  const wishlistCount = (wishlist || []).length;

  const path = location.pathname;

  const navItems = [
    { name: "Discover", href: "/", icon: Compass },
    { name: "Shop", href: "/shop", icon: Store },
    { name: "Reels", href: "/reels", icon: PlaySquare },
    { name: "Wishlist", href: "/wishlist", icon: Heart, badge: wishlistCount },
    { name: "Cart", href: "/cart", icon: ShoppingBag, badge: cartCount },
    { name: "Profile", href: "/account", icon: UserCircle2 },
  ];

  return (
    <div className="md:hidden fixed bottom-4 left-3 right-3 z-50 pointer-events-none">
      <div className="bg-white/60 backdrop-blur-xl rounded-full px-2 py-2.5 flex justify-between items-center shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/80 pointer-events-auto">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? path === "/" : path.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.href}
              className="relative flex-1 flex flex-col items-center justify-center h-full group"
            >
              <div
                className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                  isActive ? "bg-black/5 shadow-inner" : "bg-transparent hover:bg-black/5"
                }`}
              >
                <Icon
                  className={`transition-all duration-300 ${
                    isActive
                      ? "w-[22px] h-[22px] text-slate-900 fill-slate-900/10"
                      : "w-5 h-5 text-slate-900 group-hover:text-black"
                  }`}
                />

                {/* Badge */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`absolute -top-0.5 -right-0.5 font-bold rounded-full h-[15px] min-w-[15px] px-1 flex items-center justify-center transition-all duration-300 shadow-sm ${
                      isActive
                        ? "bg-slate-900 text-white text-[8px]"
                        : "bg-red-500 text-white text-[8px]"
                    }`}
                  >
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>

              {/* Minimalist Active Dot */}
              <div
                className={`absolute -bottom-1.5 w-1 h-1 rounded-full bg-slate-900 transition-all duration-300 ${
                  isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
                }`}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
