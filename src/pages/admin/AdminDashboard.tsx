import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { Package, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    customers: 0,
    sales: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [monthlySales, setMonthlySales] = useState<any[]>([]);

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const setupListeners = () => {
      let productCount = 0;
      let orderCount = 0;
      let customerCount = 0;
      let totalSales = 0;
      
      let productsLoaded = false;
      let ordersLoaded = false;
      let usersLoaded = false;

      const updateStateIfReady = () => {
        if (productsLoaded && ordersLoaded && usersLoaded) {
          setStats({
            products: productCount,
            orders: orderCount,
            customers: customerCount,
            sales: totalSales
          });
          setLoading(false);
        }
      };

      const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
        productCount = snap.size;
        productsLoaded = true;
        updateStateIfReady();
      }, (error) => console.log(error));
      unsubs.push(unsubProducts);

      const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
        orderCount = snap.size;
        let s = 0;
        const monthlyData: { [key: string]: { sales: number, orders: number } } = {};
        
        snap.forEach(doc => {
          const data = doc.data();
          if (data.status !== 'Cancelled') {
            s += (data.total || 0);
          }
          
          if (data.createdAt) {
            let date = data.createdAt;
            if (date.toDate) date = date.toDate();
            else if (typeof date === 'string') date = new Date(date);
            
            if (date instanceof Date) {
              const month = date.toLocaleString('default', { month: 'short' });
              if (!monthlyData[month]) monthlyData[month] = { sales: 0, orders: 0 };
              
              if (data.status !== 'Cancelled') {
                monthlyData[month].sales += (data.total || 0);
              }
              monthlyData[month].orders += 1;
            }
          }
        });
        
        const chartData = Object.keys(monthlyData).map(key => ({
          name: key,
          sales: monthlyData[key].sales,
          orders: monthlyData[key].orders
        }));
        
        setMonthlySales(chartData);
        totalSales = s;
        ordersLoaded = true;
        updateStateIfReady();
      }, (error) => console.log(error));
      unsubs.push(unsubOrders);

      const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        customerCount = snap.docs.filter(d => d.data().role !== 'admin').length;
        usersLoaded = true;
        updateStateIfReady();
      }, (error) => console.log(error));
      unsubs.push(unsubUsers);
      
      const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
      const unsubRecent = onSnapshot(qOrders, (snap) => {
        setRecentOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => console.log(error));
      unsubs.push(unsubRecent);
    };

    setupListeners();

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-slate-500">Loading analytics...</div>;
  }

  // Compute real growth: compare this month vs last month from monthlySales
  const thisMonth = monthlySales[monthlySales.length - 1]?.sales || 0;
  const lastMonth = monthlySales[monthlySales.length - 2]?.sales || 0;
  const revenueGrowth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1) : null;

  return (
    <div className="space-y-6 max-w-lg mx-auto md:max-w-none">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-[#2e34e5] to-[#4c39e8] rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-[22px] font-bold mb-1">Welcome back, Admin 👋</h2>
          <p className="text-white/80 text-sm">Here's what's happening today.</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Orders */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#f0efff] text-[#5e49e5] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-slate-600">Orders</span>
          </div>
          <p className="text-xl font-bold text-slate-900 mb-1">{stats.orders}</p>
          <p className="text-xs font-semibold text-[#4F46E5]">{monthlySales.length > 1 ? `${monthlySales[monthlySales.length-1]?.orders ?? 0} this period` : 'No prior data'}</p>
        </div>
        
        {/* Revenue */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#eafff0] text-[#10b981] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-slate-600">Revenue</span>
          </div>
          <p className="text-xl font-bold text-slate-900 mb-1">₹{(stats.sales * 83).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          {revenueGrowth !== null ? (
            <p className={`text-xs font-semibold ${Number(revenueGrowth) >= 0 ? 'text-[#10b981]' : 'text-red-500'}`}>
              {Number(revenueGrowth) >= 0 ? '↑' : '↓'} {Math.abs(Number(revenueGrowth))}% vs last month
            </p>
          ) : (
            <p className="text-xs text-slate-400">No prior data</p>
          )}
        </div>

        {/* Customers */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#fff0f4] text-[#e11d48] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-slate-600">Customers</span>
          </div>
          <p className="text-xl font-bold text-slate-900 mb-1">{stats.customers}</p>
          <p className="text-xs font-semibold text-[#10b981]">Total registered</p>
        </div>

        {/* Products */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#fff8e6] text-[#f59e0b] flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-slate-600">Products</span>
          </div>
          <p className="text-xl font-bold text-slate-900 mb-1">{stats.products}</p>
          <p className="text-xs font-semibold text-[#10b981]">Currently listed</p>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">Sales Overview</h3>
          <select className="text-sm font-medium text-slate-500 bg-transparent outline-none">
            <option>This Month</option>
            <option>Last Month</option>
          </select>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(value) => `${value / 1000}k`} width={30} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                formatter={(value: any) => [`₹${(Number(value) * 83).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 'Revenue']}
              />
              <Line type="monotone" dataKey="sales" stroke="#2e34e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'white' }} activeDot={{ r: 6, fill: '#2e34e5', stroke: 'white' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-transparent mt-6 pb-4">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-base font-bold text-slate-900">Recent Orders</h3>
          <Link to="/admin/orders" className="text-sm font-medium text-[#4F46E5]">View All</Link>
        </div>
        <div className="space-y-3">
          {recentOrders.length === 0 ? (
            <p className="text-sm text-slate-500 px-1">No orders yet.</p>
          ) : (
            recentOrders.map((order) => {
              return (
                <div key={order.id} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                      {(order.customerDetails?.fullName || 'G').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{order.customerDetails?.fullName || 'Guest User'}</p>
                      <p className="text-xs text-slate-500">#{order.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">₹{((order.total || 0) * 83).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                    <p className={`text-xs font-semibold ${
                      order.status === 'Pending' ? 'text-amber-500' :
                      order.status === 'Completed' || order.status === 'Delivered' ? 'text-emerald-500' :
                      order.status === 'Cancelled' ? 'text-red-500' :
                      'text-blue-500'
                    }`}>
                      {order.status}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

