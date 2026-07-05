import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, User, LogOut, Search, Menu, X, ShieldCheck, Bell, Home, ShoppingBag, Grid, Info, Mail } from 'lucide-react';
import { useStore } from '@/lib/store';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';

export function Navbar() {
  const { user, userRole, cart, wishlist, storeSettings } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(data);

      // Show toast for newly added unread notifications
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notificationData = change.doc.data();
          // Only show toast if it's unread and was created recently (within the last 10 seconds)
          // This prevents showing toasts for old unread notifications when the component first mounts
          const createdAt = notificationData.createdAt ? new Date(notificationData.createdAt).getTime() : 0;
          const isRecent = (Date.now() - createdAt) < 10000;
          
          if (!notificationData.read && isRecent) {
            import('react-toastify').then(({ toast }) => {
              toast.info(notificationData.message, {
                icon: <span>📦</span>,
                position: "top-right"
              });
            });
          }
        }
      });
    }, (error) => console.log('Notifications listener error:', error));

    return () => unsubscribe();
  }, [user]);

  const handleNotificationClick = async (notification: any) => {
    setIsNotificationsOpen(false);
    if (!notification.read) {
      try {
        await updateDoc(doc(db, 'notifications', notification.id), { read: true });
      } catch (e) {
        console.log('Failed to mark notification as read', e);
      }
    }
    if (notification.orderId) {
      navigate(`/account/orders/${notification.orderId}`);
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      useStore.getState().clearCart();
      useStore.getState().clearWishlist();
    });
  };

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
    <nav className="bg-white/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] border-b border-white/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between h-20 items-center">
          
          {/* Left: hamburger (mobile) */}
          <div className="flex items-center md:flex-none relative z-10">
            {/* Mobile Menu Button */}
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-500 hover:text-slate-900 md:hidden mr-3 -ml-1">
              <Menu className="h-6 w-6" />
            </button>

            {/* Desktop logo + nav links */}
            <Link to="/" className="hidden md:flex flex-shrink-0 items-center">
              {storeSettings?.logoUrl ? (
                <img src={storeSettings.logoUrl} alt={storeSettings.storeName || 'Shop'} className="h-14 max-w-[160px] object-contain" />
              ) : (
                <img
                  src="https://res.cloudinary.com/dcldlvuib/image/upload/v1783062854/ChatGPT_Image_Jul_3_2026_12_41_53_PM_x2cays.png"
                  alt="SwiftStore"
                  className="h-14 w-auto object-contain"
                />
              )}
            </Link>
            
            <div className="hidden lg:ml-8 lg:flex lg:items-center lg:space-x-1.5">
              <Link to="/" className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all ${location.pathname === '/' ? 'bg-blue-600 text-white shadow-sm' : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>Home</Link>
              <Link to="/shop" className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all ${location.pathname === '/shop' ? 'bg-blue-600 text-white shadow-sm' : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>Shop</Link>
              <Link to="/categories" className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all ${location.pathname === '/categories' ? 'bg-blue-600 text-white shadow-sm' : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>Categories</Link>
              <Link to="/about" className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all ${location.pathname === '/about' ? 'bg-blue-600 text-white shadow-sm' : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>About</Link>
              <Link to="/contact" className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all ${location.pathname === '/contact' ? 'bg-blue-600 text-white shadow-sm' : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>Contact</Link>
            </div>
          </div>

          {/* Mobile: Centered logo (absolute) */}
          <Link to="/" className="md:hidden absolute inset-0 flex items-center justify-center pointer-events-none">
            {storeSettings?.logoUrl ? (
              <img src={storeSettings.logoUrl} alt={storeSettings.storeName || 'Shop'} className="h-14 w-auto max-w-[140px] object-contain pointer-events-auto" />
            ) : (
              <img
                src="https://res.cloudinary.com/dcldlvuib/image/upload/v1783062854/ChatGPT_Image_Jul_3_2026_12_41_53_PM_x2cays.png"
                alt="SwiftStore"
                className="h-14 w-auto max-w-[140px] object-contain pointer-events-auto"
              />
            )}
          </Link>

          <div className="flex items-center space-x-2 md:space-x-4 relative z-10">
            <div className="hidden lg:flex items-center bg-slate-50 hover:bg-slate-100 transition-colors rounded-full px-4 py-2.5">
              <Search className="h-[18px] w-[18px] text-slate-500" />
              <input type="text" placeholder="Search products..." className="bg-transparent border-none focus:outline-none focus:ring-0 text-[14px] ml-2 w-48 xl:w-64 placeholder:text-slate-400 text-slate-700" />
            </div>

            <div className="flex items-center space-x-2 md:space-x-3">
              <button
                className="text-slate-600 hover:text-slate-900 lg:hidden"
                onClick={() => {
                  setMobileSearchOpen(v => {
                    if (!v) setTimeout(() => mobileSearchRef.current?.focus(), 50);
                    return !v;
                  });
                }}
              >
                <Search className="h-5 w-5" />
              </button>

              <Link to="/wishlist" className="hidden md:flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors relative">
                <Heart className="h-[18px] w-[18px]" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold shadow-sm">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              
              <div className="relative">
                <button 
                  onClick={() => {
                    if (!user) {
                      useStore.getState().requireAuth(() => {});
                      return;
                    }
                    setIsNotificationsOpen(!isNotificationsOpen);
                  }} 
                  className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors relative"
                >
                  <Bell className="h-[18px] w-[18px]" />
                  {user && notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold shadow-sm">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
                {user && isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-[300px] md:w-80 bg-white/90 backdrop-blur-2xl rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/80 overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-900">Notifications</h3>
                      <span className="text-xs text-slate-500">{notifications.length} total</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">No notifications yet</div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!notification.read ? 'bg-indigo-50/30' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <h4 className={`text-sm ${!notification.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                {notification.title}
                              </h4>
                              {!notification.read && <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1" />}
                            </div>
                            <p className="text-xs text-slate-500 mb-1 leading-snug">{notification.message}</p>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link to="/cart" className="hidden md:flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors relative">
                <ShoppingCart className="h-[18px] w-[18px]" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold shadow-sm">
                    {cartItemsCount}
                  </span>
                )}
              </Link>

              {user ? (
                <>
                  <div className="hidden md:flex items-center space-x-2 md:space-x-3">
                    <Link to="/account" className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors">
                      <User className="h-[18px] w-[18px]" />
                    </Link>
                    {(userRole && userRole !== 'customer' || user?.email === 'editztm3@gmail.com') && (
                      <Link to="/admin" title="Admin Panel" className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors">
                        <ShieldCheck className="h-[18px] w-[18px]" />
                      </Link>
                    )}
                    <button onClick={handleLogout} className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors" title="Logout">
                      <LogOut className="h-[18px] w-[18px] ml-0.5" />
                    </button>
                  </div>
                </>
              ) : (
                <Link to="/login" className="hidden md:flex items-center justify-center h-10 px-5 rounded-full border border-slate-200 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">Login</Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Search Bar (slide down) ── */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-white/50 bg-white/70 backdrop-blur-xl ${
          mobileSearchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <form
          className="flex items-center gap-2 px-4 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (mobileSearchQuery.trim()) {
              navigate(`/shop?search=${encodeURIComponent(mobileSearchQuery.trim())}`);
              setMobileSearchOpen(false);
              setMobileSearchQuery('');
            }
          }}
        >
          <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <input
            ref={mobileSearchRef}
            type="text"
            value={mobileSearchQuery}
            onChange={(e) => setMobileSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-slate-800 placeholder:text-slate-400"
          />
          {mobileSearchQuery && (
            <button
              type="button"
              onClick={() => setMobileSearchQuery('')}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="submit"
            className="bg-slate-900 text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-slate-700 transition-colors flex-shrink-0"
          >
            Search
          </button>
        </form>
      </div>
    </nav>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] md:hidden transition-opacity" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      <div 
        className={`fixed inset-y-0 left-0 z-[70] w-4/5 max-w-sm bg-white/90 backdrop-blur-3xl shadow-[4px_0_24px_rgba(0,0,0,0.1)] border-r border-white/80 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          {storeSettings?.logoUrl ? (
            <img src={storeSettings.logoUrl} alt={storeSettings.storeName || 'Shop'} className="h-8 max-w-[150px] object-contain" />
          ) : (
            <img
              src="https://res.cloudinary.com/dcldlvuib/image/upload/v1783062854/ChatGPT_Image_Jul_3_2026_12_41_53_PM_x2cays.png"
              alt="SwiftStore"
              className="h-8 w-auto object-contain"
            />
          )}
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500 hover:text-slate-900 bg-[#F4F6F8] p-2 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <div className="px-4 space-y-2">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center px-4 py-2.5 text-[15px] font-semibold rounded-[20px] transition-colors ${location.pathname === '/' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full mr-4 ${location.pathname === '/' ? 'bg-transparent text-blue-600' : 'bg-[#F4F6F8] text-[#5C6A82]'}`}>
                <Home className="w-5 h-5" />
              </div>
              Home
            </Link>
            
            <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center px-4 py-2.5 text-[15px] font-semibold rounded-[20px] transition-colors ${location.pathname === '/shop' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full mr-4 ${location.pathname === '/shop' ? 'bg-transparent text-blue-600' : 'bg-[#F4F6F8] text-[#5C6A82]'}`}>
                <ShoppingBag className="w-5 h-5" />
              </div>
              Shop
            </Link>

            <Link to="/categories" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center px-4 py-2.5 text-[15px] font-semibold rounded-[20px] transition-colors ${location.pathname === '/categories' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full mr-4 ${location.pathname === '/categories' ? 'bg-transparent text-blue-600' : 'bg-[#F4F6F8] text-[#5C6A82]'}`}>
                <Grid className="w-5 h-5" />
              </div>
              Categories
            </Link>

            <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center px-4 py-2.5 text-[15px] font-semibold rounded-[20px] transition-colors ${location.pathname === '/about' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full mr-4 ${location.pathname === '/about' ? 'bg-transparent text-blue-600' : 'bg-[#F4F6F8] text-[#5C6A82]'}`}>
                <Info className="w-5 h-5" />
              </div>
              About
            </Link>

            <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center px-4 py-2.5 text-[15px] font-semibold rounded-[20px] transition-colors ${location.pathname === '/contact' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full mr-4 ${location.pathname === '/contact' ? 'bg-transparent text-blue-600' : 'bg-[#F4F6F8] text-[#5C6A82]'}`}>
                <Mail className="w-5 h-5" />
              </div>
              Contact
            </Link>
          </div>

          <div className="px-4 mt-8">
            <div className="space-y-3">
              {user ? (
                 <>
                   <Link to="/account" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-2.5 text-[15px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-[20px] transition-colors">
                     <div className="flex items-center justify-center w-10 h-10 rounded-full mr-4 bg-transparent text-blue-600">
                       <User className="w-5 h-5" />
                     </div>
                     My Account
                   </Link>
                   {(userRole && userRole !== 'customer' || user?.email === 'editztm3@gmail.com') && (
                     <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-2.5 text-[15px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-[20px] transition-colors">
                       <div className="flex items-center justify-center w-10 h-10 rounded-full mr-4 bg-transparent text-indigo-600">
                         <ShieldCheck className="w-5 h-5" />
                       </div>
                       Admin Dashboard
                     </Link>
                   )}
                   <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="flex items-center w-full text-left px-5 py-2.5 mt-2 text-[15px] font-semibold text-[#FF4C4C] hover:bg-red-50 rounded-[20px] transition-colors">
                     <LogOut className="w-5 h-5 mr-5 ml-1" />
                     Logout
                   </button>
                 </>
              ) : (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex justify-center items-center px-4 py-3 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full mt-2 transition-colors">Login / Register</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
