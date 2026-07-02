import { useStore } from '@/lib/store';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { LayoutDashboard, Package, ListTree, ShoppingCart, Users, LogOut, ArrowLeft, Settings, Bell, MoreHorizontal, X, TrendingUp, Menu, Shield } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

export default function AdminLayout() {
  const { user, userRole, storeSettings } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const initialLoadRef = useRef(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (userRole !== null && userRole === 'customer' && user?.email !== 'editztm3@gmail.com') {
      navigate('/');
    }
  }, [user, userRole, navigate]);

  // Use refs to hold current values inside the callback — avoids re-subscribing on every update
  const recentOrdersRef = useRef<any[]>([]);
  const unreadCountRef = useRef(0);

  useEffect(() => {
    // Only set up the listener if the user is an admin
    if (!user || (userRole === 'customer' && user?.email !== 'editztm3@gmail.com')) {
      return;
    }

    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'), limit(10));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (initialLoadRef.current) {
        initialLoadRef.current = false;
        
        const orders: any[] = [];
        let unread = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          orders.push({ id: doc.id, ...data });
          if (data.status === 'Pending') unread++;
        });
        recentOrdersRef.current = orders;
        unreadCountRef.current = unread;
        setRecentOrders(orders);
        setUnreadCount(unread);
        return;
      }

      const updatedOrders = [...recentOrdersRef.current];
      let newUnreadCount = unreadCountRef.current;

      snapshot.docChanges().forEach((change) => {
        const orderData = { id: change.doc.id, ...change.doc.data() } as any;
        
        if (change.type === 'added') {
          updatedOrders.unshift(orderData);
          if (updatedOrders.length > 10) updatedOrders.pop();
          if (orderData.status === 'Pending') newUnreadCount++;
        } else if (change.type === 'modified') {
          const index = updatedOrders.findIndex(o => o.id === change.doc.id);
          if (index !== -1) {
            const oldStatus = updatedOrders[index].status;
            updatedOrders[index] = orderData;
            if (oldStatus === 'Pending' && orderData.status !== 'Pending') {
              newUnreadCount = Math.max(0, newUnreadCount - 1);
            } else if (oldStatus !== 'Pending' && orderData.status === 'Pending') {
              newUnreadCount++;
            }
          }
        }
      });
      
      recentOrdersRef.current = updatedOrders;
      unreadCountRef.current = newUnreadCount;
      setRecentOrders([...updatedOrders]);
      setUnreadCount(newUnreadCount);
    }, (error) => {
      console.log('Orders listener error (likely during logout):', error);
    });

    return () => unsubscribe();
  }, [user, userRole]); // ✅ Only re-subscribe when auth state changes


  // Click outside listener for notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notifications-dropdown') && !target.closest('.notifications-btn')) {
        setNotificationsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (userRole === null || !user || (userRole === 'customer' && user?.email !== 'editztm3@gmail.com')) {
    return <div className="min-h-screen flex items-center justify-center">Loading admin panel...</div>;
  }

  const allNavItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true, roles: ['Administrator', 'Manager', 'Editor', 'Support'] },
    { name: 'Storefront', path: '/admin/storefront', icon: LayoutDashboard, exact: false, roles: ['Administrator', 'Manager', 'Editor'] },
    { name: 'Products', path: '/admin/products', icon: Package, exact: false, roles: ['Administrator', 'Manager', 'Editor'] },
    { name: 'Categories', path: '/admin/categories', icon: ListTree, exact: false, roles: ['Administrator', 'Manager', 'Editor'] },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart, exact: false, roles: ['Administrator', 'Manager', 'Support'] },
    { name: 'Customers', path: '/admin/customers', icon: Users, exact: false, roles: ['Administrator', 'Manager', 'Support'] },
    { name: 'Admin Users', path: '/admin/users', icon: Shield, exact: false, roles: ['Administrator'] },
    { name: 'Reports', path: '/admin/reports', icon: TrendingUp, exact: false, roles: ['Administrator', 'Manager'] },
    { name: 'Settings', path: '/admin/settings', icon: Settings, exact: false, roles: ['Administrator'] },
  ];

  // Superadmin bypasses role checks
  const isSuperAdmin = user?.email === 'editztm3@gmail.com';
  
  const navItems = allNavItems.filter(item => 
    isSuperAdmin || (userRole && item.roles.includes(userRole as string))
  );

  const allBottomNavItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true, roles: ['Administrator', 'Manager', 'Editor', 'Support'] },
    { name: 'Products', path: '/admin/products', icon: Package, exact: false, roles: ['Administrator', 'Manager', 'Editor'] },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart, exact: false, roles: ['Administrator', 'Manager', 'Support'] },
  ];

  const bottomNavItems = allBottomNavItems.filter(item => 
    isSuperAdmin || (userRole && item.roles.includes(userRole as string))
  );

  return (
    <div className="min-h-screen bg-slate-50 flex pb-16 md:pb-0">
      {/* Sidebar - hidden on mobile */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          {storeSettings?.logoUrl ? (
            <img src={storeSettings.logoUrl} alt={storeSettings.storeName || 'Store'} className="h-8 max-w-[150px] object-contain brightness-0 invert" />
          ) : (
            <span className="text-xl font-bold tracking-tight text-white">{storeSettings?.storeName || 'Admin Panel'}</span>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact 
                ? location.pathname === item.path 
                : location.pathname.startsWith(item.path);
                
              const Icon = item.icon;
              
              return (
                <Link 
                  key={item.name}
                  to={item.path} 
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive 
                      ? 'bg-slate-800 text-white' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} /> 
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-slate-800">
          <Link to="/" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-400 hover:text-white hover:bg-slate-800 mb-2">
            <ArrowLeft className="mr-3 h-5 w-5" /> Back to Store
          </Link>
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-red-400 hover:text-white hover:bg-red-900/50 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] md:h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white flex items-center justify-between px-4 md:px-8 z-10">
          <div className="flex items-center">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors mr-1">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 ml-1 md:ml-0">
              {navItems.find(item => item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path))?.name || 'Admin'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button 
                className="notifications-btn relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  if (!notificationsOpen) setUnreadCount(0); // Mark as read when opened
                }}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {notificationsOpen && (
                <div className="notifications-dropdown absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50">
                  <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                    <Link 
                      to="/admin/orders" 
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[11px] font-bold text-[#4F46E5] hover:text-[#4338ca]"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {recentOrders.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">
                        No recent notifications
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {recentOrders.map(order => (
                          <Link
                            key={order.id}
                            to={`/admin/orders?id=${order.id}`}
                            onClick={() => setNotificationsOpen(false)}
                            className={`flex items-start p-3 hover:bg-slate-50 transition-colors ${
                              order.status === 'Pending' ? 'bg-indigo-50/30' : ''
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              order.status === 'Pending' ? 'bg-[#4F46E5] text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <Package className="w-4 h-4" />
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="text-[13px] font-bold text-slate-800">
                                New order #{order.id.slice(0, 8)}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {order.shippingAddress?.fullName || 'Customer'} placed an order for ${order.total?.toFixed(2)}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1 flex items-center">
                                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                                  order.status === 'Pending' ? 'bg-orange-400' : 'bg-slate-300'
                                }`}></span>
                                {order.status}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <Link to="/admin/profile" className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 block">
              <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'Admin'}&background=4F46E5&color=fff`} alt="Admin" className="w-full h-full object-cover" />
            </Link>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#fafafa]">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 z-50 px-2 pb-safe">
        {bottomNavItems.map((item) => {
          const isActive = item.exact 
            ? location.pathname === item.path 
            : location.pathname.startsWith(item.path);
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.name}
              to={item.path} 
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-[#4F46E5]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${mobileMenuOpen ? 'text-[#4F46E5]' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <MoreHorizontal className="w-5 h-5" strokeWidth={mobileMenuOpen ? 2.5 : 2} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>

      {/* Mobile Side Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex">
          <div className="w-[85%] max-w-sm bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
              {storeSettings?.logoUrl ? (
                <img src={storeSettings.logoUrl} alt={storeSettings.storeName || 'Store'} className="h-8 max-w-[150px] object-contain brightness-0 invert" />
              ) : (
                <span className="text-xl font-bold tracking-tight text-white">{storeSettings?.storeName || 'Admin Panel'}</span>
              )}
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white p-2 -mr-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="px-4 space-y-2">
                {navItems.map((item) => {
                  const isActive = item.exact 
                    ? location.pathname === item.path 
                    : location.pathname.startsWith(item.path);
                    
                  const Icon = item.icon;
                  
                  return (
                    <Link 
                      key={item.name}
                      to={item.path} 
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3.5 rounded-xl transition-colors ${
                        isActive 
                          ? 'bg-slate-800/80 text-white font-semibold' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50 font-medium'
                      }`}
                    >
                      <Icon className={`mr-4 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} /> 
                      <span className="text-[15px]">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            <div className="p-4 border-t border-slate-800">
              <button 
                onClick={() => { setMobileMenuOpen(false); signOut(auth); }}
                className="w-full flex items-center px-8 py-3.5 text-[15px] font-medium rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <LogOut className="mr-4 h-5 w-5" /> Logout
              </button>
            </div>
          </div>
          {/* Clickable overlay background to close */}
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </div>
  );
}

