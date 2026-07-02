import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useStore } from '@/lib/store';
import { useForm } from 'react-hook-form';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ChevronLeft, ShoppingCart, Heart, Banknote, CreditCard, Landmark, QrCode } from 'lucide-react';
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

      console.log('Attempting to addDoc to collection "orders":', orderData);
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      console.log('Successfully wrote document with ID:', docRef.id);

      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order-success/${docRef.id}`);
    } catch (e: any) {
      console.error('Firestore Write Error Details:', {
        code: e.code,
        message: e.message,
        details: e.details,
        name: e.name
      });
      toast.error(`Failed to place order: ${e.message}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white pb-20 md:pb-0">
        <div className="hidden md:block">
          <Navbar />
        </div>
        <main className="max-w-md mx-auto md:max-w-7xl relative min-h-screen flex flex-col items-center justify-center">
          <h1 className="text-xl font-bold mb-4">Checkout</h1>
          <p className="text-slate-500">Your cart is empty.</p>
        </main>
      </div>
    );
  }

  const OrderSummaryComponent = ({ isMobile = false }) => (
    <div className={`${isMobile ? 'block md:hidden pb-8 px-1' : 'bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm hidden md:block'}`}>
      <h2 className={`font-bold text-slate-900 ${isMobile ? 'text-[15px] mb-4' : 'text-lg'}`}>Order summary</h2>
      {!isMobile && (
        <ul className="mt-4 divide-y divide-slate-200 text-sm font-medium text-slate-900">
          {cart.map((item) => (
            <li key={item.id} className="flex items-center py-4 space-x-4">
              <img src={item.image} alt={item.name} width={64} height={64} className="h-16 w-16 rounded-md object-contain mix-blend-multiply flex-none" referrerPolicy="no-referrer" />
              <div className="flex-auto space-y-1">
                <h3>{item.name}</h3>
                {(item.size || item.color) && (
                  <p className="text-xs text-slate-500">
                    {item.color && <span>Color: {item.color}</span>}
                    {item.size && item.color && <span className="mx-1">•</span>}
                    {item.size && <span>Size: {item.size}</span>}
                  </p>
                )}
                <p className="text-slate-500">Qty: {item.quantity}</p>
              </div>
              <p className="flex-none text-base font-medium">₹{(item.price * item.quantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </li>
          ))}
        </ul>
      )}
      <dl className={`space-y-4 text-sm font-medium text-slate-900 ${isMobile ? '' : 'border-t border-slate-200 pt-6 mt-6'}`}>
        <div className="flex items-center justify-between">
          <dt className="text-slate-600">Subtotal</dt>
          <dd>₹{subtotalINR.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-slate-600">Tax ({taxRate}%)</dt>
          <dd>₹{tax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-slate-600">Shipping</dt>
          <dd className={shipping === 0 ? "text-emerald-500" : ""}>
            {shipping === 0 ? "Free" : `₹${shipping.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          </dd>
        </div>
        <div className="flex items-center justify-between pt-2 md:border-t md:border-slate-200 md:pt-6">
          <dt className="text-base font-bold text-slate-900">Total</dt>
          <dd className="text-base font-bold text-slate-900">₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</dd>
        </div>
      </dl>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <div className="hidden md:block">
        <Navbar />
      </div>

      <main className="max-w-md mx-auto md:max-w-7xl relative min-h-screen flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden px-4 py-4 flex items-center justify-between sticky top-0 bg-white z-20">
          <button onClick={() => step === 'shipping' ? navigate(-1) : setStep('shipping')} className="p-2 -ml-2 text-slate-700">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Checkout</h1>
          <div className="w-10"></div>
        </div>

        <div className="hidden md:block">
          <h1 className="text-3xl font-bold text-slate-900 mb-8 mt-8 px-4 sm:px-6 lg:px-8">Checkout</h1>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-8 py-4 mb-2 md:justify-start md:space-x-12 border-b border-slate-50 md:border-none">
          <div className="flex items-center">
            <div className={`rounded-full w-6 h-6 flex items-center justify-center text-[11px] font-bold mr-2 ${step === 'shipping' ? 'bg-[#4F46E5] text-white' : 'bg-[#4F46E5] text-white'}`}>
              {step === 'shipping' ? '1' : '✓'}
            </div>
            <span className={`font-semibold text-sm ${step === 'shipping' ? 'text-[#4F46E5]' : 'text-slate-900'}`}>Shipping</span>
          </div>
          <div className="flex items-center">
            <div className={`rounded-full w-6 h-6 flex items-center justify-center text-[11px] font-bold mr-2 ${step === 'payment' ? 'bg-[#4F46E5] text-white' : 'bg-slate-100 text-slate-400'}`}>2</div>
            <span className={`font-medium text-sm ${step === 'payment' ? 'text-[#4F46E5] font-semibold' : 'text-slate-400'}`}>Payment</span>
          </div>
          <div className="flex items-center">
            <div className="bg-slate-100 text-slate-400 rounded-full w-6 h-6 flex items-center justify-center text-[11px] font-bold mr-2">3</div>
            <span className="text-slate-400 font-medium text-sm">Review</span>
          </div>
        </div>

        <div className="flex-1 px-4 md:px-8 pb-8 lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16 mt-2">
          <div>
            {step === 'shipping' && (
              <>
                <h2 className="text-[15px] font-bold text-slate-900 mb-6 px-1">Shipping Address</h2>
                <form id="checkout-form" onSubmit={handleSubmit(onSubmitShipping)} className="space-y-4">

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 px-1">Full Name</label>
                    <input type="text" placeholder="Ravi Kumar" {...register('fullName', { required: true })} className="block w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] focus:ring-1 focus:ring-slate-200 focus:border-slate-200 outline-none placeholder:text-slate-400" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 px-1">Email</label>
                    <input type="email" placeholder="ravi@gmail.com" defaultValue={user?.email || ''} {...register('email', { required: true })} className="block w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] focus:ring-1 focus:ring-slate-200 focus:border-slate-200 outline-none placeholder:text-slate-400" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 px-1">Phone Number</label>
                    <input type="tel" placeholder="+91 98765 43210" {...register('phone', { required: true })} className="block w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] focus:ring-1 focus:ring-slate-200 focus:border-slate-200 outline-none placeholder:text-slate-400" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 px-1">Address</label>
                    <input type="text" placeholder="123, Park Street" {...register('address', { required: true })} className="block w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] focus:ring-1 focus:ring-slate-200 focus:border-slate-200 outline-none placeholder:text-slate-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5 px-1">City</label>
                      <input type="text" placeholder="Bangalore" {...register('city', { required: true })} className="block w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] focus:ring-1 focus:ring-slate-200 focus:border-slate-200 outline-none placeholder:text-slate-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5 px-1">Pincode</label>
                      <input type="text" placeholder="560001" {...register('zip', { required: true })} className="block w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] focus:ring-1 focus:ring-slate-200 focus:border-slate-200 outline-none placeholder:text-slate-400" />
                    </div>
                  </div>

                  <div className="pt-8">
                    <button
                      type="submit"
                      form="checkout-form"
                      className="w-full bg-[#4F46E5] text-white rounded-xl py-4 flex items-center justify-center text-[15px] font-semibold hover:bg-[#4338ca] transition shadow-sm"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </form>
              </>
            )}

            {step === 'payment' && (
              <>
                <h2 className="text-[15px] font-bold text-slate-900 mb-4 px-1">Payment Method</h2>
                <div className="space-y-3 mb-8">
                  <button
                    onClick={() => setPaymentMethod('cod')}
                    className={`w-full flex items-center p-4 border rounded-xl transition ${paymentMethod === 'cod' ? 'border-[#4F46E5] bg-[#EEF2FF] shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 mr-4">
                      <Banknote className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-[15px] font-semibold text-slate-900">Cash on Delivery</p>
                      <p className="text-[13px] text-slate-500">Pay when you receive</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-[#4F46E5]' : 'border-slate-300'}`}>
                      {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 bg-[#4F46E5] rounded-full" />}
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('upi')}
                    className={`w-full flex items-center p-4 border rounded-xl transition ${paymentMethod === 'upi' ? 'border-[#4F46E5] bg-[#EEF2FF] shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 mr-4">
                      <QrCode className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-[15px] font-semibold text-slate-900">UPI / QR Code</p>
                      <p className="text-[13px] text-slate-500">Pay using any UPI app</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'upi' ? 'border-[#4F46E5]' : 'border-slate-300'}`}>
                      {paymentMethod === 'upi' && <div className="w-2.5 h-2.5 bg-[#4F46E5] rounded-full" />}
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`w-full flex items-center p-4 border rounded-xl transition ${paymentMethod === 'card' ? 'border-[#4F46E5] bg-[#EEF2FF] shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 mr-4">
                      <CreditCard className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-[15px] font-semibold text-slate-900">Credit / Debit Card</p>
                      <p className="text-[13px] text-slate-500">Visa, Mastercard, RuPay</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'card' ? 'border-[#4F46E5]' : 'border-slate-300'}`}>
                      {paymentMethod === 'card' && <div className="w-2.5 h-2.5 bg-[#4F46E5] rounded-full" />}
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`w-full flex items-center p-4 border rounded-xl transition ${paymentMethod === 'netbanking' ? 'border-[#4F46E5] bg-[#EEF2FF] shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 mr-4">
                      <Landmark className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-[15px] font-semibold text-slate-900">Net Banking</p>
                      <p className="text-[13px] text-slate-500">All major banks supported</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'netbanking' ? 'border-[#4F46E5]' : 'border-slate-300'}`}>
                      {paymentMethod === 'netbanking' && <div className="w-2.5 h-2.5 bg-[#4F46E5] rounded-full" />}
                    </div>
                  </button>
                </div>

                <OrderSummaryComponent isMobile={true} />

                <div className="pt-2">
                  <button
                    onClick={() => setStep('review')}
                    className="w-full bg-[#4F46E5] text-white rounded-xl py-4 flex items-center justify-center text-[15px] font-semibold hover:bg-[#4338ca] transition shadow-sm"
                  >
                    Continue to Review
                  </button>
                </div>
              </>
            )}

            {step === 'review' && (
              <>
                <h2 className="text-[15px] font-bold text-slate-900 mb-6 px-1">Review Order</h2>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] p-5 mb-4">
                  <h3 className="text-[13px] font-bold text-slate-900 mb-3">Shipping Address</h3>
                  <div className="text-[13px] text-slate-600 space-y-1">
                    <p className="font-medium text-slate-900">{shippingData?.fullName}</p>
                    <p>{shippingData?.address}</p>
                    <p>{shippingData?.city} - {shippingData?.zip}</p>
                    <p>{shippingData?.phone}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] p-5 mb-6">
                  <h3 className="text-[13px] font-bold text-slate-900 mb-2">Payment Method</h3>
                  <p className="text-[13px] text-slate-600">
                    {paymentMethod === 'cod' && 'Cash on Delivery'}
                    {paymentMethod === 'upi' && 'UPI / QR Code'}
                    {paymentMethod === 'card' && 'Credit / Debit Card'}
                    {paymentMethod === 'netbanking' && 'Net Banking'}
                  </p>
                </div>

                <h3 className="text-[15px] font-bold text-slate-900 mb-4 px-1">Order Items</h3>

                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] p-3">
                      <div className="w-16 h-16 shrink-0 bg-[#f8f9fa] rounded-xl flex items-center justify-center p-2">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain mix-blend-multiply"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="ml-4 flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-[13px] font-semibold text-slate-900 line-clamp-1 pr-4">{item.name}</h4>
                          <p className="text-[13px] font-bold text-slate-900 shrink-0">₹{(item.price * item.quantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <p className="text-[12px] text-slate-500 font-medium">₹{item.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })} × {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-1 space-y-3 text-[13px] font-medium text-slate-600 mb-6 border-b border-slate-100 pb-6">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span className="text-slate-900 font-bold">₹{subtotalINR.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tax ({taxRate}%)</span>
                    <span className="text-slate-900 font-bold">₹{tax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? "text-emerald-500 font-bold" : "text-slate-900 font-bold"}>
                      {shipping === 0 ? "Free" : `₹${shipping.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    </span>
                  </div>
                </div>

                <div className="px-1 flex items-center justify-between mb-8">
                  <span className="text-[15px] font-bold text-slate-900">Total</span>
                  <span className="text-[15px] font-bold text-slate-900">₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onSubmitFinal}
                    disabled={isPlacingOrder}
                    className="w-full bg-[#4F46E5] text-white rounded-xl py-4 flex items-center justify-center text-[15px] font-semibold hover:bg-[#4338ca] transition shadow-sm disabled:bg-indigo-300"
                  >
                    {isPlacingOrder ? 'Processing...' : 'Place Order'}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="mt-10 lg:mt-0 hidden md:block">
            <OrderSummaryComponent />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation (Visible only on small screens) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50">
        <Link to="/" className="flex flex-col items-center text-slate-400 hover:text-slate-900 transition">
          <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link to="/shop" className="flex flex-col items-center text-slate-400 hover:text-slate-900 transition">
          <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className="text-[10px] font-medium">Shop</span>
        </Link>
        <Link to="/wishlist" className="flex flex-col items-center text-slate-400 hover:text-slate-900 transition">
          <Heart className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Wishlist</span>
        </Link>
        <Link to="/cart" className="flex flex-col items-center text-slate-400 hover:text-slate-900 transition">
          <div className="relative">
            <ShoppingCart className="w-6 h-6 mb-1" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Cart</span>
        </Link>
        <Link to="/account" className="flex flex-col items-center text-slate-400 hover:text-slate-900 transition">
          <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </div>
  );
}
