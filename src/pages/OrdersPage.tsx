import { useStore } from '@/lib/store';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { 
  ArrowLeft, 
  Package, 
  Home, 
  ShoppingBag, 
  Heart, 
  ShoppingCart, 
  User,
  ChevronRight,
  Clock
} from 'lucide-react';

export default function OrdersPage() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => {
        const data = doc.data();
        let dateVal = data.createdAt;
        if (dateVal && dateVal.toDate) {
          dateVal = dateVal.toDate().toISOString();
        } else if (dateVal instanceof Date) {
          dateVal = dateVal.toISOString();
        }
        return { id: doc.id, ...data, createdAt: dateVal };
      });
      fetchedOrders.sort((a: any, b: any) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      setOrders(fetchedOrders);
      setLoading(false);
    }, (error) => {
      console.log("Error fetching orders", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, navigate]);

  if (!user) return null;

  const activeOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
  const pastOrders = orders.filter(o => o.status === 'Delivered' || o.status === 'Cancelled');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-orange-100 text-orange-600';
      case 'Processing': return 'bg-blue-100 text-blue-600';
      case 'Packed': return 'bg-yellow-100 text-yellow-700';
      case 'Shipped': return 'bg-purple-100 text-purple-600';
      case 'Delivered': return 'bg-green-100 text-green-600';
      case 'Cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const renderOrderList = (orderList: any[], emptyMessage: string) => {
    if (orderList.length === 0) {
      return (
        <div className="text-center py-8 px-4 bg-white rounded-[24px] border border-slate-100">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-500">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {orderList.map(order => (
          <div key={order.id} className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                  <Package className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-900">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-[11px] font-medium text-slate-500 flex items-center mt-0.5">
                    <Clock className="w-3 h-3 mr-1" />
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                {order.status || 'Pending'}
              </span>
            </div>
            
            <div className="space-y-3 mb-4">
              {order.items.slice(0, 2).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-800 line-clamp-1">{item.name}</p>
                      <p className="text-[11px] font-medium text-slate-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="text-[13px] font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              {order.items.length > 2 && (
                <p className="text-[11px] font-medium text-slate-500 text-center pt-2">
                  + {order.items.length - 2} more items
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Total Amount</p>
                <p className="text-[15px] font-bold text-[#4F46E5]">${(order.total || 0).toFixed(2)}</p>
              </div>
              <Link to={`/account/orders/${order.id}`} className="flex items-center text-[13px] font-bold text-slate-700 hover:text-[#4F46E5] transition-colors">
                View Details <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      <div className="w-full max-w-md bg-slate-50 min-h-screen relative pb-24 sm:rounded-[40px] sm:shadow-xl overflow-hidden sm:my-8 sm:min-h-[850px] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-12 pb-6 flex items-center">
          <button onClick={() => navigate(-1)} className="text-slate-800 hover:text-slate-600 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[17px] font-bold text-slate-900 ml-4">My Orders</h1>
        </div>

        <main className="px-6 flex-1 overflow-y-auto pb-6">
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-100 animate-pulse">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-50">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                    <div className="h-5 bg-slate-200 rounded-full w-20"></div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-slate-200 rounded-2xl mr-4 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              <section>
                <h2 className="text-sm font-bold text-slate-800 mb-4 px-1 uppercase tracking-wider">Active Orders</h2>
                {renderOrderList(activeOrders, "No active orders right now.")}
              </section>

              <section>
                <h2 className="text-sm font-bold text-slate-800 mb-4 px-1 uppercase tracking-wider">Past Orders</h2>
                {renderOrderList(pastOrders, "No past orders.")}
              </section>
            </div>
          )}
        </main>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 rounded-b-[40px] shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] flex justify-between items-center z-10">
          <Link to="/" className="flex flex-col items-center text-slate-400 hover:text-slate-900 transition-colors">
            <Home className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold">Home</span>
          </Link>
          <Link to="/shop" className="flex flex-col items-center text-slate-400 hover:text-slate-900 transition-colors">
            <ShoppingBag className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold">Shop</span>
          </Link>
          <Link to="/wishlist" className="flex flex-col items-center text-slate-400 hover:text-slate-900 transition-colors">
            <Heart className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold">Wishlist</span>
          </Link>
          <Link to="/cart" className="flex flex-col items-center text-slate-400 hover:text-slate-900 transition-colors">
            <ShoppingCart className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold">Cart</span>
          </Link>
          <Link to="/account" className="flex flex-col items-center text-slate-400 hover:text-slate-900 transition-colors">
            <User className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
