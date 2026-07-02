import { useStore } from "@/lib/store";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { toast } from "react-toastify";
import {
  Package,
  Heart,
  MapPin,
  Settings,
  CreditCard,
  LogOut,
  ChevronRight,
  User,
  ChevronLeft,
} from "lucide-react";

export default function AccountPage() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      const fetchUserData = async () => {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        } catch (error) {
          console.log("Error fetching user data:", error);
        }
      };
      fetchUserData();
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      useStore.getState().clearCart();
      useStore.getState().clearWishlist();
      navigate("/");
    } catch (error: any) {
      toast.error("Failed to log out: " + error.message);
    }
  };

  const handleComingSoon = (feature: string) => {
    toast.info(`${feature} coming soon!`);
  };

  if (!user) return null;

  const menuItems = [
    { label: "My Orders", icon: Package, href: "/account/orders" },
    { label: "My Wishlist", icon: Heart, href: "/wishlist" },
    { label: "My Addresses", icon: MapPin, href: "/account/addresses" },
    { label: "Account Settings", icon: Settings, onClick: () => handleComingSoon("Account Settings") },
    { label: "Payment Methods", icon: CreditCard, onClick: () => handleComingSoon("Payment Methods") },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      {/* Desktop Navbar */}
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden px-4 py-4 flex items-center justify-between sticky top-0 bg-slate-50 z-20 border-b border-slate-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-700">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">My Account</h1>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-10">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
            <User className="w-10 h-10 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900 truncate">
              {userData?.fullName || user.displayName || "User"}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5 truncate">{user.email}</p>
            <span className="inline-block mt-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              Customer
            </span>
          </div>
        </div>

        {/* Menu */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {menuItems.map((item, idx) => {
              const Icon = item.icon;
              const content = (
                <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition">
                      <Icon className="w-4.5 h-4.5 text-slate-600" />
                    </div>
                    <span className="text-[15px] font-semibold text-slate-800">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />
                </div>
              );

              return item.href ? (
                <Link key={idx} to={item.href}>{content}</Link>
              ) : (
                <button key={idx} onClick={item.onClick} className="w-full text-left">{content}</button>
              );
            })}
          </div>
        </div>

        {/* Logout */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition">
                <LogOut className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-[15px] font-semibold text-red-600">Logout</span>
            </div>
            <ChevronRight className="w-4 h-4 text-red-300 group-hover:text-red-500 transition" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
