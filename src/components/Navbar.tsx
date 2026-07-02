import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, LogOut, Search, Menu, X, ShieldCheck, Bell } from 'lucide-react';
import { useStore } from '@/lib/store';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';

export function Navbar() {
  const { user, userRole, cart, wishlist, storeSettings } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const navigate = useNavigate();

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
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Mobile Menu Button (Left on mobile) */}
          <div className="md:hidden flex items-center">
             <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-500 hover:text-slate-900">
               <Menu className="h-6 w-6" />
             </button>
          </div>

          <div className="flex items-center justify-center flex-1 md:flex-none md:justify-start">
            <Link to="/" className="flex-shrink-0 flex items-center">
              {storeSettings?.logoUrl ? (
                <img src={storeSettings.logoUrl} alt={storeSettings.storeName || 'Shop'} className="h-8 max-w-[120px] object-contain" />
              ) : (
                <span className="font-bold text-2xl tracking-tight text-slate-900">{storeSettings?.storeName || 'Shoply.'}</span>
              )}
            </Link>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link to="/" className="text-slate-500 hover:text-slate-900 px-3 py-2 text-sm font-medium">Home</Link>
              <Link to="/shop" className="text-slate-500 hover:text-slate-900 px-3 py-2 text-sm font-medium">Shop</Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center bg-slate-100 rounded-full px-3 py-1.5">
              <Search className="h-4 w-4 text-slate-400" />
              <input type="text" placeholder="Search..." className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm ml-2 w-32 lg:w-48" />
            </div>

            <div className="flex items-center space-x-4">
              <button className="text-slate-500 hover:text-slate-900 md:hidden">
                <Search className="h-5 w-5" />
              </button>

              <Link to="/wishlist" className="hidden md:flex text-slate-500 hover:text-slate-900 relative">
                <Heart className="h-6 w-6" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
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
                  className="text-slate-500 hover:text-slate-900 relative flex items-center"
                >
                  <Bell className="h-5 w-5 md:h-6 md:w-6" />
                  {user && notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
                {user && isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-[300px] md:w-80 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50">
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

              <Link to="/cart" className="hidden md:flex text-slate-500 hover:text-slate-900 relative">
                <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="hidden md:flex items-center space-x-3">
                  {(userRole && userRole !== 'customer' || user?.email === 'editztm3@gmail.com') && (
                    <Link to="/admin" className="px-3 py-1.5 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors flex items-center">
                      <ShieldCheck className="w-4 h-4 mr-1.5" />
                      Admin
                    </Link>
                  )}
                  <Link to="/account" className="text-slate-500 hover:text-slate-900">
                    <User className="h-6 w-6" />
                  </Link>
                  <button onClick={handleLogout} className="text-slate-500 hover:text-red-600">
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <Link to="/login" className="hidden md:block text-sm font-medium text-slate-700 hover:text-slate-900">Login</Link>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] md:hidden transition-opacity" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      <div 
        className={`fixed inset-y-0 left-0 z-[70] w-4/5 max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          {storeSettings?.logoUrl ? (
            <img src={storeSettings.logoUrl} alt={storeSettings.storeName || 'Shop'} className="h-8 max-w-[150px] object-contain" />
          ) : (
            <span className="font-bold text-2xl tracking-tight text-slate-900">{storeSettings?.storeName || 'Shoply.'}</span>
          )}
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 space-y-1">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl">Home</Link>
            <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl">Shop</Link>
            <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between px-4 py-3 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl">
              <div className="flex items-center">
                <Heart className="w-5 h-5 mr-3 text-slate-400" />
                Wishlist
              </div>
              {wishlist.length > 0 && <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">{wishlist.length}</span>}
            </Link>
            <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between px-4 py-3 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl">
              <div className="flex items-center">
                <ShoppingCart className="w-5 h-5 mr-3 text-slate-400" />
                Cart
              </div>
              {cartItemsCount > 0 && <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">{cartItemsCount}</span>}
            </Link>
            {user && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between items-center">
                  <span>Notifications</span>
                  {notifications.filter(n => !n.read).length > 0 && (
                     <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                       {notifications.filter(n => !n.read).length} New
                     </span>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="px-8 py-4 text-slate-400 text-sm italic">No notifications</div>
                ) : (
                  notifications.slice(0, 5).map(notification => (
                    <button 
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)} 
                      className="w-full flex items-center px-4 py-3 text-sm text-left hover:bg-slate-50 rounded-xl"
                    >
                      <Bell className={`w-4 h-4 mr-3 ${!notification.read ? 'text-indigo-500' : 'text-slate-400'}`} />
                      <div className="flex-1 overflow-hidden">
                        <div className={`truncate ${!notification.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{notification.title}</div>
                        <div className="text-xs text-slate-500 truncate">{notification.message}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="px-4 mt-4">
            <h4 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Account</h4>
            <div className="space-y-1">
              {user ? (
                 <>
                   {(userRole === 'admin' || user?.email === 'editztm3@gmail.com') && (
                     <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-base font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl flex items-center">
                       <ShieldCheck className="w-5 h-5 mr-3" />
                       Admin Dashboard
                     </Link>
                   )}
                   <Link to="/account" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-3 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl">
                     <User className="w-5 h-5 mr-3 text-slate-400" />
                     My Account
                   </Link>
                   <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="flex items-center w-full text-left px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-xl">
                     <LogOut className="w-5 h-5 mr-3 text-red-400" />
                     Logout
                   </button>
                 </>
              ) : (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-base font-bold text-center text-white bg-slate-900 hover:bg-slate-800 rounded-xl mt-2">Login / Register</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
