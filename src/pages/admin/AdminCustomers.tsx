import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Search } from 'lucide-react';
import { useAdminRoleGuard } from '@/hooks/useAdminRoleGuard';

export default function AdminCustomers() {
  useAdminRoleGuard(['Administrator', 'Manager', 'Support']);
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((u: any) => u.role !== 'admin');
      
      // Sort by creation date descending if available
      users.sort((a: any, b: any) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      
      setCustomers(users);
    }, (error) => {
      console.log('Users listener error:', error);
    });

    const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(allOrders);
      setLoading(false);
    }, (error) => {
      console.log('Orders listener error:', error);
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeOrders();
    };
  }, []);

  const customersWithStats = useMemo(() => {
    return customers.map(customer => {
      const customerOrders = orders.filter(o => o.userId === customer.uid || o.userId === customer.id);
      const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      return {
        ...customer,
        orderCount: customerOrders.length,
        totalSpent
      };
    });
  }, [customers, orders]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customersWithStats;
    const term = searchTerm.toLowerCase();
    return customersWithStats.filter(c => 
      (c.displayName && c.displayName.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term))
    );
  }, [customersWithStats, searchTerm]);

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-500 font-medium">Loading customers...</div>;

  return (
    <div className="space-y-6 max-w-lg mx-auto md:max-w-none pb-4">
      {/* Header is handled by AdminLayout, but we can add our search bar here */}
      
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search customers..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-11 pr-4 py-3 border border-slate-100 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] w-full text-sm font-medium"
        />
      </div>

      <div className="space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-medium">
            No customers found.
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-50 flex items-center gap-4 hover:border-slate-200 transition-colors cursor-pointer">
              <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden border border-slate-200 bg-slate-100">
                <img 
                  src={customer.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.displayName || 'User')}&background=e2e8f0&color=475569`} 
                  alt={customer.displayName || 'Customer'} 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-bold text-slate-900 truncate mb-0.5">
                  {customer.displayName || 'Unknown Customer'}
                </h4>
                <div className="text-sm text-slate-500 font-medium truncate mb-0.5">
                  {customer.email}
                </div>
                <div className="text-sm text-slate-400 font-medium">
                  Orders: <span className="text-[#3b41e3]">{customer.orderCount}</span>
                </div>
              </div>
              
              <div className="flex-shrink-0 text-right">
                <span className="text-[17px] font-black text-slate-900 block">
                  ₹{(customer.totalSpent * 83).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
