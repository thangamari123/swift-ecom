import { Navbar } from '@/components/Navbar';
import { Link, useParams } from 'react-router-dom';
import { Check, ShoppingBag } from 'lucide-react';

export default function OrderSuccessPage() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-white">
      <div className="hidden md:block">
        <Navbar />
      </div>
      <main className="max-w-md mx-auto md:max-w-7xl px-4 py-16 md:py-24 flex flex-col items-center justify-center min-h-[80vh] text-center">
        
        <div className="relative w-48 h-48 flex items-center justify-center mb-8 mx-auto">
          {/* Decorative background circles */}
          <div className="absolute inset-0 bg-[#EEF2FF] rounded-full opacity-50 transform scale-110"></div>
          <div className="absolute inset-4 bg-[#E0E7FF] rounded-full opacity-50 transform scale-105"></div>
          
          <ShoppingBag className="w-24 h-24 text-[#4F46E5] relative z-10" strokeWidth={1.5} />
          
          <div className="absolute bottom-6 right-8 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-20">
            <Check className="w-6 h-6 text-white" strokeWidth={3} />
          </div>

          {/* Decorative sparkles */}
          <div className="absolute top-8 left-8 w-3 h-3 bg-amber-400 rounded-sm rotate-45"></div>
          <div className="absolute top-12 right-10 w-2 h-2 bg-emerald-400 rounded-full"></div>
          <div className="absolute bottom-16 left-10 w-2.5 h-2.5 bg-blue-400 rounded-full"></div>
        </div>
        
        <h1 className="text-[22px] md:text-3xl font-bold text-slate-900 mb-3 px-4">Order Placed<br/>Successfully!</h1>
        
        <p className="text-[13px] md:text-[15px] text-slate-500 mb-8 max-w-[280px] mx-auto leading-relaxed">
          Thank you for your order.<br/>
          Your order has been placed successfully.
        </p>

        <div className="w-full max-w-sm flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-8">
          <span className="text-[13px] font-medium text-slate-500">Order ID</span>
          <span className="text-[14px] font-bold text-slate-900 bg-white px-3 py-1.5 rounded-lg shadow-sm">#{id?.slice(0, 8).toUpperCase() || '09012545'}</span>
        </div>
        
        <div className="w-full max-w-sm flex flex-col items-center">
          <Link 
            to="/"
            className="w-full flex items-center justify-center py-4 px-6 rounded-2xl text-[15px] font-bold text-white bg-[#4F46E5] hover:bg-[#4338ca] transition-all shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] mb-4"
          >
            Continue Shopping
          </Link>
          <Link 
            to="/orders"
            className="py-3 px-6 text-[14px] font-bold text-[#4F46E5] hover:text-[#4338ca] transition-all"
          >
            View My Orders
          </Link>
        </div>
      </main>
    </div>
  );
}
