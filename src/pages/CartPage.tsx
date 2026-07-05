import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { useStore } from '@/lib/store';
import { Trash2, ChevronLeft, ShoppingCart } from 'lucide-react';
import { getProductUrl } from '@/utils/slug';
import { Link, useNavigate } from 'react-router-dom';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, requireAuth, storeSettings } = useStore();
  const navigate = useNavigate();

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);
  
  const taxRate = storeSettings.taxRate ?? 8.5;
  const flatShippingRate = storeSettings.flatShippingRate ?? 15.00;
  const freeShippingThreshold = storeSettings.freeShippingThreshold ?? 100.00;
  
  // Convert threshold and shipping to INR if needed? Assuming the settings are in USD but we multiply by 83, 
  // or maybe the settings are directly the final currency. Let's assume settings are in USD.
  const thresholdINR = freeShippingThreshold * 83;
  const shippingINR = flatShippingRate * 83;
  
  const shipping = subtotal === 0 ? 0 : (subtotal >= thresholdINR ? 0 : shippingINR);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + shipping + tax;

  const handleCheckout = () => {
    requireAuth(() => {
      navigate('/checkout');
    });
  };

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <div className="hidden md:block">
        <Navbar />
      </div>

      <main className="w-full max-w-6xl mx-auto px-0 md:px-8 relative min-h-screen flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden px-4 py-4 flex items-center justify-between sticky top-0 bg-white z-20">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-700">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Cart ({cartItemsCount})</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        <div className="hidden md:flex items-center justify-between pt-8 pb-4">
           <h1 className="text-3xl font-bold text-slate-900">Shopping Cart ({cartItemsCount} items)</h1>
        </div>
        
        {cart.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl mx-4 shadow-sm mt-4 flex-1">
            <ShoppingCart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-slate-700 mb-4">Your cart is empty</h2>
            <Link to="/shop" className="inline-block text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 px-6 py-2 rounded-xl">Continue Shopping</Link>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:grid md:grid-cols-12 md:gap-x-12 md:items-start px-4 pb-8">
            <div className="md:col-span-7 flex flex-col space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] p-3 relative">
                  <div className="w-24 h-24 shrink-0 bg-[#f8f9fa] rounded-xl flex items-center justify-center p-2">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain mix-blend-multiply"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="ml-4 flex-1 flex flex-col justify-between py-1">
                    <div className="pr-8">
                      <Link to={getProductUrl({ id: item.productId, slug: item.productSlug, name: item.name })}>
                        <h3 className="text-sm font-semibold text-slate-900 mb-1 leading-tight line-clamp-2">
                          {item.name}
                        </h3>
                      </Link>
                      {(item.size || item.color) && (
                        <p className="text-xs text-slate-500 mb-1">
                          {item.color && <span>Color: {item.color}</span>}
                          {item.size && item.color && <span className="mx-1">•</span>}
                          {item.size && <span>Size: {item.size}</span>}
                        </p>
                      )}
                      <p className="font-bold text-[15px] text-slate-900 mb-2">
                        ₹{item.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="flex items-center border border-slate-200 rounded-lg">
                        <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-800">-</button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-800">+</button>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => removeFromCart(item.id)} 
                    className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <section className="mt-8 md:mt-0 md:col-span-5 flex flex-col">
              {/* Promo Code */}
              <div className="flex space-x-3 mb-6">
                <input 
                  type="text" 
                  placeholder="Have a promo code?" 
                  className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-slate-200 outline-none"
                />
                <button className="px-6 py-3 bg-[#EEF2FF] text-[#4F46E5] font-semibold text-sm rounded-xl hover:bg-[#E0E7FF] transition-colors">
                  Apply
                </button>
              </div>

              {/* Order Summary */}
              <div className="bg-white md:border md:border-slate-100 md:shadow-sm md:rounded-2xl md:p-6 pb-24 md:pb-6">
                <h2 className="text-base font-bold text-slate-900 mb-4 hidden md:block">Order Summary</h2>
                <h2 className="text-base font-bold text-slate-900 mb-4 md:hidden">Order Summary</h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between text-slate-600 font-medium">
                    <span>Subtotal</span>
                    <span className="text-slate-900 font-bold">₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 font-medium">
                    <span>Tax ({taxRate}%)</span>
                    <span className="text-slate-900 font-bold">₹{tax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 font-medium pb-4 border-b border-slate-100">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? "text-emerald-500 font-bold" : "text-slate-900 font-bold"}>
                      {shipping === 0 ? "Free" : `₹${shipping.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-base font-bold text-slate-900">Total</span>
                    <span className="text-base font-bold text-slate-900">₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-[#4F46E5] text-white rounded-xl py-4 flex items-center justify-center text-[15px] font-semibold hover:bg-[#4338ca] transition shadow-sm"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
