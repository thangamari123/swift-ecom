import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useStore } from './lib/store';
import { db } from './lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { LoginPopup } from './components/LoginPopup';

// Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import AddressesPage from './pages/AddressesPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import WishlistPage from './pages/WishlistPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import CategoriesPage from './pages/CategoriesPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ReelsPage from './pages/ReelsPage';
import Seeder from './pages/Seeder';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminStorefront from './pages/admin/AdminStorefront';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';
import AdminProfile from './pages/admin/AdminProfile';
import AdminSettings from './pages/admin/AdminSettings';

const AdminRoute = () => {
  const { user, userRole } = useStore();
  
  if (userRole === null && user) {
    return <div className="min-h-screen flex items-center justify-center">Loading admin panel...</div>;
  }
  
  if (!user || (userRole === 'customer' && user?.email !== 'editztm3@gmail.com')) {
    return <Navigate to="/login" replace />;
  }
  
  return <AdminLayout />;
};

const CustomerRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function CartSync() {
  const { user, cart } = useStore();

  useEffect(() => {
    if (user) {
      setDoc(doc(db, 'cart', user.uid), { items: cart });
    }
  }, [user, cart]);

  return null;
}

function SettingsSync() {
  const { setStoreSettings } = useStore();

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'store'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStoreSettings({
          storeName: data.storeName || 'Shoply.',
          logoUrl: data.logoUrl,
          supportEmail: data.supportEmail,
          supportPhone: data.supportPhone,
          taxRate: data.taxRate ?? 8.5,
          flatShippingRate: data.flatShippingRate ?? 15.00,
          freeShippingThreshold: data.freeShippingThreshold ?? 100.00,
          enableStripe: data.enableStripe ?? true,
          enablePayPal: data.enablePayPal ?? true,
          enableCOD: data.enableCOD ?? true,
        });
      }
    }, (error) => console.log('Settings listener error:', error));

    return () => unsubscribe();
  }, [setStoreSettings]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <CartSync />
      <SettingsSync />
      <LoginPopup />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/reels" element={<ReelsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/product/:id" element={<ProductDetailsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CustomerRoute><CheckoutPage /></CustomerRoute>} />
        <Route path="/order-success/:id" element={<CustomerRoute><OrderSuccessPage /></CustomerRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/account" element={<CustomerRoute><AccountPage /></CustomerRoute>} />
        <Route path="/account/addresses" element={<CustomerRoute><AddressesPage /></CustomerRoute>} />
        <Route path="/account/orders" element={<CustomerRoute><OrdersPage /></CustomerRoute>} />
        <Route path="/account/orders/:id" element={<CustomerRoute><OrderDetailsPage /></CustomerRoute>} />
        <Route path="/wishlist" element={<CustomerRoute><WishlistPage /></CustomerRoute>} />
        <Route path="/seeder" element={<Seeder />} />
        
        <Route path="/admin" element={<AdminRoute />}>
          <Route index element={<AdminDashboard />} />
          <Route path="storefront" element={<AdminStorefront />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
      <ToastContainer position="bottom-right" />
    </BrowserRouter>
  );
}
