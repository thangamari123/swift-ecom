import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  CreditCard,
  Clock,
  CheckCircle2,
  Truck,
  Box
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function OrderDetailsPage() {
  const { id } = useParams();
  const { user } = useStore();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!id) return;
    const docRef = doc(db, 'orders', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const orderData = docSnap.data();
        if (orderData.userId !== user.uid && user.email !== 'editztm3@gmail.com') {
          toast.error('You do not have permission to view this order.');
          navigate('/account/orders');
          return;
        }
        setOrder({ id: docSnap.id, ...orderData });
        setLoading(false);
      } else {
        toast.error('Order not found');
        navigate('/account/orders');
        setLoading(false);
      }
    }, (error) => {
      console.log("Error fetching order details:", error);
      toast.error('Failed to load order details');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, user, navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'Processing': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'Packed': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Shipped': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'Delivered': return 'bg-green-100 text-green-600 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-600 border-red-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center pb-8">
      <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl bg-white min-h-screen sm:min-h-max sm:rounded-[40px] sm:shadow-xl overflow-hidden sm:my-8 flex flex-col relative pb-8">
        
        {/* Header */}
        <div className="px-6 pt-12 pb-6 flex items-center border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <button onClick={() => navigate(-1)} className="text-slate-800 hover:text-slate-600 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[17px] font-bold text-slate-900 ml-4">Order Details</h1>
        </div>

        {loading ? (
          <div className="px-6 py-6 animate-pulse space-y-6">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="h-3 bg-slate-200 rounded w-16 mb-2"></div>
                  <div className="h-5 bg-slate-200 rounded w-24"></div>
                </div>
                <div className="h-6 w-20 bg-slate-200 rounded-lg"></div>
              </div>
              <div className="pt-4 border-t border-slate-200/50">
                <div className="h-3 bg-slate-200 rounded w-20 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-32"></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="h-4 bg-slate-200 rounded w-24 mb-4"></div>
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-xl"></div>
                  <div className="flex-1 py-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/4 mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : !order ? (
          <div className="text-center py-20 text-slate-500">Order not found.</div>
        ) : (
          <main className="px-6 py-6 flex-1 overflow-y-auto space-y-6">
            
            {/* Order Status Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Order ID</p>
                  <p className="text-[15px] font-bold text-slate-900">#{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className={`px-3 py-1 rounded-lg border text-[11px] font-bold uppercase tracking-wider flex items-center ${getStatusColor(order.status)}`}>
                  {order.status === 'Delivered' && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                  {order.status === 'Shipped' && <Truck className="w-3.5 h-3.5 mr-1" />}
                  {order.status === 'Packed' && <Package className="w-3.5 h-3.5 mr-1" />}
                  {order.status === 'Processing' && <Box className="w-3.5 h-3.5 mr-1" />}
                  {order.status === 'Pending' && <Clock className="w-3.5 h-3.5 mr-1" />}
                  {order.status || 'Pending'}
                </div>
              </div>
              <div className="flex items-center text-[13px] font-medium text-slate-600 pt-3 border-t border-slate-200/60">
                <Clock className="w-4 h-4 mr-2 text-slate-400" />
                Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
              </div>
            </div>

            {/* Items */}
            <section>
              <h2 className="text-[13px] font-bold text-slate-800 mb-3 uppercase tracking-wider">Items in your order</h2>
              <div className="space-y-3">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center p-3 rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-[14px] font-bold text-slate-800 line-clamp-1">{item.name}</p>
                      <p className="text-[12px] font-medium text-slate-500 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Order Summary */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider">Payment Summary</h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-[13px] text-slate-600 font-medium">
                  <span>Subtotal</span>
                  <span>${order.items?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[13px] text-slate-600 font-medium">
                  <span>Shipping</span>
                  <span>$5.00</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-[13px] text-green-600 font-medium">
                    <span>Discount</span>
                    <span>-${order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-3 mt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[15px] font-bold text-slate-900">Total</span>
                  <span className="text-[18px] font-bold text-[#4F46E5]">${order.total?.toFixed(2)}</span>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Shipping Address */}
              <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center mr-3">
                    <MapPin className="w-4 h-4 text-[#4F46E5]" />
                  </div>
                  <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider">Shipping Address</h2>
                </div>
                <div className="text-[13px] text-slate-600 font-medium leading-relaxed pl-11">
                  <p className="text-slate-900 font-bold mb-1">{order.shippingAddress?.fullName}</p>
                  <p>{order.shippingAddress?.address || order.shippingAddress?.street}</p>
                  <p>{order.shippingAddress?.city}, {order.shippingAddress?.zip || order.shippingAddress?.zipCode}</p>
                  <p className="mt-1">{order.shippingAddress?.phone}</p>
                </div>
              </section>

              {/* Payment Method */}
              <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center mr-3">
                    <CreditCard className="w-4 h-4 text-[#4F46E5]" />
                  </div>
                  <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider">Payment Method</h2>
                </div>
                <div className="text-[13px] text-slate-600 font-medium pl-11">
                  <p className="capitalize text-slate-900 font-bold">{order.paymentMethod?.replace('_', ' ') || 'Cash on Delivery'}</p>
                  <p className="mt-1 text-[12px] text-slate-500">Status: <span className="font-bold text-slate-700 capitalize">{order.paymentStatus || 'Pending'}</span></p>
                </div>
              </section>
            </div>
            
          </main>
        )}
      </div>
    </div>
  );
}
