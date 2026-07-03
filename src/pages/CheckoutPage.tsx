import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useStore } from '@/lib/store';
import { useForm } from 'react-hook-form';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, Banknote, CreditCard, Landmark, QrCode, ShieldCheck, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function CheckoutPage() {
  const { cart, user, clearCart, storeSettings } = useStore();
  const { register, handleSubmit, setValue } = useForm();
  const navigate = useNavigate();
  const [step, setStep] = useState<'shipping' | 'payment' | 'review'>('shipping');
  const [shippingData, setShippingData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchDefaultAddress = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const addresses = data.addresses || [];
            let defaultAddress = addresses.find((addr: any) => addr.isDefault);
            if (!defaultAddress && addresses.length > 0) {
              defaultAddress = addresses[0];
            }

            if (defaultAddress) {
              setValue('fullName', defaultAddress.fullName || '');
              setValue('phone', defaultAddress.phone || '');
              setValue('address', defaultAddress.street || '');
              setValue('city', defaultAddress.city || '');
              setValue('zip', defaultAddress.zipCode || '');
            } else {
              setValue('fullName', data.fullName || user.displayName || '');
              setValue('phone', data.phone || '');
            }
          }
        } catch (error) {
          console.error("Error fetching default address:", error);
        }
      };

      fetchDefaultAddress();
    }
  }, [user, setValue]);

  const subtotalUSD = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const subtotalINR = subtotalUSD * 83;

  const taxRate = storeSettings.taxRate ?? 8.5;
  const flatShippingRate = storeSettings.flatShippingRate ?? 15.00;
  const freeShippingThreshold = storeSettings.freeShippingThreshold ?? 100.00;

  const thresholdINR = freeShippingThreshold * 83;
  const shippingINR = flatShippingRate * 83;

  const shipping = subtotalINR === 0 ? 0 : (subtotalINR >= thresholdINR ? 0 : shippingINR);
  const tax = subtotalINR * (taxRate / 100);
  const total = subtotalINR + shipping + tax;

  const onSubmitShipping = (data: any) => {
    setShippingData(data);
    setStep('payment');
  };

  const onSubmitFinal = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderData = {
        userId: user?.uid || 'guest',
        items: cart,
        subtotal: subtotalINR,
        tax: tax,
        shipping: shipping,
        total: total,
        customerDetails: {
          email: shippingData.email || '',
          fullName: shippingData.fullName || '',
          phone: shippingData.phone || ''
        },
        shippingAddress: {
          phone: shippingData.phone || '',
          address: shippingData.address || '',
          city: shippingData.city || '',
          zip: shippingData.zip || ''
        },
        paymentMethod: paymentMethod,
        status: 'Pending',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order-success/${docRef.id}`);
    } catch (e: any) {
      console.error('Firestore Write Error Details:', e);
      toast.error(`Failed to place order: ${e.message}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="max-w-md mx-auto md:max-w-7xl relative min-h-[60vh] flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-serif text-slate-900 mb-2">Your cart is empty</h1>
          <p className="text-sm text-slate-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Link to="/" className="px-8 py-3.5 bg-slate-900 text-white text-sm font-semibold rounded-full hover:bg-slate-800 transition-colors">
            Start Shopping
          </Link>
        </main>
      </div>
    );
  }

  const OrderSummaryComponent = () => (
    <div className="bg-slate-50/50 backdrop-blur-3xl rounded-3xl p-6 md:p-8 lg:p-10 border border-slate-100 lg:sticky lg:top-24 h-fit">
      <h2 className="text-xl font-serif text-slate-900 mb-6">Order Summary</h2>
      
      <div className="space-y-4 mb-8">
        {cart.map((item) => (
          <div key={item.id} className="flex items-center gap-4 group">
            <div className="relative w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-2 shadow-sm border border-slate-100/50">
              <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-md">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{item.name}</h3>
              {(item.size || item.color) && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {item.color} {item.size && `• ${item.size}`}
                </p>
              )}
            </div>
            <p className="text-sm font-bold text-slate-900">
              ₹{(item.price * item.quantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3 text-sm text-slate-500 mb-6 border-t border-slate-200/50 pt-6">
        <div className="flex justify-between items-center">
          <span>Subtotal</span>
          <span className="text-slate-900 font-semibold">₹{subtotalINR.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Taxes ({taxRate}%)</span>
          <span className="text-slate-900 font-semibold">₹{tax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Shipping</span>
          <span className={shipping === 0 ? "text-emerald-500 font-semibold" : "text-slate-900 font-semibold"}>
            {shipping === 0 ? "Free" : `₹${shipping.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-slate-200/50">
        <span className="text-lg font-serif text-slate-900">Total</span>
        <span className="text-2xl font-bold text-slate-900">₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className="max-w-7xl mx-auto flex flex-col lg:flex-row min-h-screen">
        
        {/* Left Column - Form */}
        <div className="w-full lg:w-3/5 lg:pr-16 xl:pr-24 pt-8 lg:pt-16 px-6 lg:px-12 xl:px-16 pb-24">
          
          {/* Mobile Header / Logo */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <Link to="/" className="text-2xl font-serif text-slate-900">
              SwiftStore
            </Link>
            <button onClick={() => navigate('/cart')} className="text-sm font-semibold text-slate-500 hover:text-slate-900">
              Back to Cart
            </button>
          </div>

          {/* Breadcrumbs */}
          <nav className="flex items-center text-xs font-semibold uppercase tracking-wider mb-10">
            <button onClick={() => navigate('/cart')} className="text-slate-400 hover:text-slate-900 transition-colors">Cart</button>
            <ChevronRight className="w-4 h-4 mx-2 text-slate-300" />
            <button onClick={() => setStep('shipping')} className={`${step === 'shipping' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-900'} transition-colors`}>Shipping</button>
            <ChevronRight className="w-4 h-4 mx-2 text-slate-300" />
            <button onClick={() => step === 'review' ? setStep('payment') : null} className={`${step === 'payment' ? 'text-slate-900' : 'text-slate-400'} transition-colors ${step === 'review' ? 'hover:text-slate-900 cursor-pointer' : 'cursor-default'}`}>Payment</button>
            <ChevronRight className="w-4 h-4 mx-2 text-slate-300" />
            <span className={`${step === 'review' ? 'text-slate-900' : 'text-slate-400'}`}>Review</span>
          </nav>

          <div className="lg:hidden mb-10">
            <OrderSummaryComponent />
          </div>

          {step === 'shipping' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-serif text-slate-900 mb-8">Shipping Information</h2>
              <form id="checkout-form" onSubmit={handleSubmit(onSubmitShipping)} className="space-y-4">

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Contact</h3>
                  <input 
                    type="email" 
                    placeholder="Email address" 
                    defaultValue={user?.email || ''} 
                    {...register('email', { required: true })} 
                    className="w-full px-5 py-4 bg-slate-50/80 border-transparent rounded-2xl text-[15px] focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all placeholder:text-slate-400" 
                  />
                  <input 
                    type="tel" 
                    placeholder="Phone number" 
                    {...register('phone', { required: true })} 
                    className="w-full px-5 py-4 bg-slate-50/80 border-transparent rounded-2xl text-[15px] focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all placeholder:text-slate-400" 
                  />
                </div>

                <div className="space-y-4 pt-6">
                  <h3 className="text-sm font-bold text-slate-900">Delivery Address</h3>
                  <input 
                    type="text" 
                    placeholder="Full name" 
                    {...register('fullName', { required: true })} 
                    className="w-full px-5 py-4 bg-slate-50/80 border-transparent rounded-2xl text-[15px] focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all placeholder:text-slate-400" 
                  />
                  <input 
                    type="text" 
                    placeholder="Street address" 
                    {...register('address', { required: true })} 
                    className="w-full px-5 py-4 bg-slate-50/80 border-transparent rounded-2xl text-[15px] focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all placeholder:text-slate-400" 
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="City" 
                      {...register('city', { required: true })} 
                      className="w-full px-5 py-4 bg-slate-50/80 border-transparent rounded-2xl text-[15px] focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all placeholder:text-slate-400" 
                    />
                    <input 
                      type="text" 
                      placeholder="PIN code" 
                      {...register('zip', { required: true })} 
                      className="w-full px-5 py-4 bg-slate-50/80 border-transparent rounded-2xl text-[15px] focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all placeholder:text-slate-400" 
                    />
                  </div>
                </div>

                <div className="pt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <button type="button" onClick={() => navigate('/cart')} className="text-sm font-semibold text-slate-500 hover:text-slate-900 order-2 sm:order-1 text-center sm:text-left">
                    Return to cart
                  </button>
                  <button
                    type="submit"
                    form="checkout-form"
                    className="w-full sm:w-auto px-10 py-4 bg-slate-900 text-white rounded-2xl text-[15px] font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 order-1 sm:order-2"
                  >
                    Continue to Payment
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 'payment' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-serif text-slate-900 mb-8">Payment Method</h2>
              <p className="text-sm text-slate-500 mb-6">All transactions are secure and encrypted.</p>
              
              <div className="space-y-4 mb-10">
                {[
                  { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive', icon: Banknote },
                  { id: 'upi', label: 'UPI / QR Code', desc: 'Google Pay, PhonePe, Paytm', icon: QrCode },
                  { id: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay', icon: CreditCard },
                  { id: 'netbanking', label: 'Net Banking', desc: 'All major banks supported', icon: Landmark }
                ].map((method) => {
                  const Icon = method.icon;
                  const isActive = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`w-full flex items-center p-5 border-2 rounded-2xl transition-all duration-300 ${isActive ? 'border-slate-900 bg-slate-50' : 'border-transparent bg-slate-50/50 hover:bg-slate-50'}`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mr-4 transition-colors ${isActive ? 'border-slate-900' : 'border-slate-300'}`}>
                        {isActive && <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 mr-4 border border-slate-100">
                        <Icon className="w-5 h-5 text-slate-700" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-[15px] font-bold text-slate-900">{method.label}</p>
                        <p className="text-[13px] font-medium text-slate-500">{method.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <button type="button" onClick={() => setStep('shipping')} className="text-sm font-semibold text-slate-500 hover:text-slate-900 order-2 sm:order-1 text-center sm:text-left">
                  Return to shipping
                </button>
                <button
                  onClick={() => setStep('review')}
                  className="w-full sm:w-auto px-10 py-4 bg-slate-900 text-white rounded-2xl text-[15px] font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 order-1 sm:order-2"
                >
                  Review Order
                </button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-serif text-slate-900 mb-8">Review Order</h2>
              
              <div className="bg-slate-50/80 rounded-3xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4 border-b border-slate-200/50 pb-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Contact</h3>
                    <p className="text-[15px] font-medium text-slate-900">{shippingData?.email}</p>
                  </div>
                  <button onClick={() => setStep('shipping')} className="text-xs font-bold text-slate-900 hover:underline">Change</button>
                </div>
                
                <div className="flex items-center justify-between mb-4 border-b border-slate-200/50 pb-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ship To</h3>
                    <p className="text-[15px] font-medium text-slate-900">{shippingData?.address}, {shippingData?.city} {shippingData?.zip}</p>
                  </div>
                  <button onClick={() => setStep('shipping')} className="text-xs font-bold text-slate-900 hover:underline">Change</button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Method</h3>
                    <p className="text-[15px] font-medium text-slate-900 capitalize">
                      {paymentMethod === 'cod' && 'Cash on Delivery'}
                      {paymentMethod === 'upi' && 'UPI / QR Code'}
                      {paymentMethod === 'card' && 'Credit / Debit Card'}
                      {paymentMethod === 'netbanking' && 'Net Banking'}
                    </p>
                  </div>
                  <button onClick={() => setStep('payment')} className="text-xs font-bold text-slate-900 hover:underline">Change</button>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium order-2 sm:order-1 justify-center sm:justify-start">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  Secure checkout
                </div>
                <button
                  onClick={onSubmitFinal}
                  disabled={isPlacingOrder}
                  className="w-full sm:w-auto px-12 py-4 bg-slate-900 text-white rounded-2xl text-[15px] font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-70 flex items-center justify-center gap-2 order-1 sm:order-2"
                >
                  {isPlacingOrder && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isPlacingOrder ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Column - Order Summary (Desktop) */}
        <div className="hidden lg:block w-2/5 bg-slate-50 border-l border-slate-100 pt-16 px-12 xl:px-16 pb-24">
          <OrderSummaryComponent />
        </div>
        
      </main>
    </div>
  );
}
