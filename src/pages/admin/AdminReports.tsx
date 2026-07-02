import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAdminRoleGuard } from '@/hooks/useAdminRoleGuard';

export default function AdminReports() {
  useAdminRoleGuard(['Administrator', 'Manager']);
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    customers: 0,
    sales: 0
  });
  const [loading, setLoading] = useState(true);
  const [monthlySales, setMonthlySales] = useState<any[]>([]);
  const [categorySalesData, setCategorySalesData] = useState<any[]>([]);

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

      let ordersList: any[] = [];
      let productsMap: Record<string, string> = {};

      const updateStateIfReady = () => {
        if (productsLoaded && ordersLoaded && usersLoaded) {
          setStats({
            products: productCount,
            orders: orderCount,
            customers: customerCount,
            sales: totalSales
          });
          
          const catSales: Record<string, number> = {};
          let totalSalesVal = 0;
          
          ordersList.forEach(order => {
             if (order.status !== 'Cancelled' && order.items) {
                order.items.forEach((item: any) => {
                   const cat = productsMap[item.id] || item.category || 'Others';
                   const lineTotal = item.price * item.quantity;
                   catSales[cat] = (catSales[cat] || 0) + lineTotal;
                   totalSalesVal += lineTotal;
                });
             }
          });
          
          let catData = Object.keys(catSales).map(key => ({
            name: key,
            value: catSales[key],
            percent: totalSalesVal > 0 ? Math.round((catSales[key] / totalSalesVal) * 100) : 0
          })).sort((a, b) => b.value - a.value);

          // No fake data — only show real categories from actual orders
          setCategorySalesData(catData);
          setLoading(false);
        }
      };

      const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
        productCount = snap.size;
        productsMap = {};
        snap.forEach(doc => {
          productsMap[doc.id] = doc.data().category || 'Others';
        });
        productsLoaded = true;
        updateStateIfReady();
      }, (error) => console.log(error));
      unsubs.push(unsubProducts);

      const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
        orderCount = snap.size;
        let s = 0;
        const monthlyData: { [key: string]: { sales: number, orders: number } } = {};
        
        ordersList = [];
        snap.forEach(doc => {
          const data = doc.data();
          ordersList.push({ id: doc.id, ...data });
          
          if (data.status !== 'Cancelled') {
            s += (data.total || 0);
          }
          
          if (data.createdAt) {
            let date = data.createdAt;
            if (date.toDate) date = date.toDate();
            else if (typeof date === 'string') date = new Date(date);
            
            if (date instanceof Date) {
              const month = date.toLocaleString('default', { month: 'short' });
              const day = date.getDate() + ' ' + month;
              if (!monthlyData[day]) monthlyData[day] = { sales: 0, orders: 0 };
              
              if (data.status !== 'Cancelled') {
                monthlyData[day].sales += (data.total || 0);
              }
              monthlyData[day].orders += 1;
            }
          }
        });
        
        let chartData = Object.keys(monthlyData).map(key => ({
          name: key,
          sales: monthlyData[key].sales,
          orders: monthlyData[key].orders
        })).slice(-5);
        
        // No fake data — show real data only
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
    };

    setupListeners();

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-slate-500 font-medium">Loading reports...</div>;
  }

  const COLORS = ['#3b41e3', '#0ea5e9', '#f59e0b', '#f97316', '#8b5cf6', '#10b981'];
  const avgOrder = stats.orders > 0 ? stats.sales / stats.orders : 0;

  return (
    <div className="space-y-6 max-w-lg mx-auto md:max-w-none pb-8">
      {/* Header handled by Layout, but let's add the date filter here */}
      <div className="flex justify-end mb-4">
        <select className="text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-[#4F46E5]">
          <option>This Month</option>
          <option>Last Month</option>
          <option>This Year</option>
        </select>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Sales */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
          <span className="text-sm font-medium text-slate-500 mb-2">Total Sales</span>
          <p className="text-[22px] font-bold text-slate-900 mb-2">₹{(stats.sales * 83).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          <div className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-50/50 w-fit px-1.5 py-0.5 rounded">
            ↑ 8.7%
          </div>
        </div>
        
        {/* Total Orders */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
          <span className="text-sm font-medium text-slate-500 mb-2">Total Orders</span>
          <p className="text-[22px] font-bold text-slate-900 mb-2">{stats.orders}</p>
          <div className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-50/50 w-fit px-1.5 py-0.5 rounded">
            ↑ 12.5%
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
          <span className="text-sm font-medium text-slate-500 mb-2">Total Customers</span>
          <p className="text-[22px] font-bold text-slate-900 mb-2">{stats.customers}</p>
          <div className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-50/50 w-fit px-1.5 py-0.5 rounded">
            ↑ 9.3%
          </div>
        </div>

        {/* Avg Order */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
          <span className="text-sm font-medium text-slate-500 mb-2">Avg Order</span>
          <p className="text-[22px] font-bold text-slate-900 mb-2">₹{(avgOrder * 83).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          <div className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-50/50 w-fit px-1.5 py-0.5 rounded">
            ↑ 6.1%
          </div>
        </div>
      </div>

      {/* Sales Overview Chart */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-lg font-bold text-slate-900">Sales Overview</h3>
        </div>
        <div className="h-56 -ml-4">
          {monthlySales.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <span className="text-4xl mb-3">📊</span>
              <p className="text-sm font-semibold">No sales data yet</p>
              <p className="text-xs mt-1">Data will appear once orders are placed</p>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlySales} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} tickFormatter={(value) => value === 0 ? '0' : `${Math.floor(value / 1000)}K`} width={40} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px', fontWeight: 'bold' }}
                formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 'Revenue']}
              />
              <Line type="monotone" dataKey="sales" stroke="#3b41e3" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'white', stroke: '#3b41e3' }} activeDot={{ r: 6, fill: '#3b41e3', stroke: 'white' }} />
            </LineChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Sales by Category */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Sales by Category</h3>
        
        {categorySalesData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <span className="text-4xl mb-3">🗂️</span>
            <p className="text-sm font-semibold">No category data yet</p>
            <p className="text-xs mt-1">Data will appear once orders with items are placed</p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            {/* Donut Chart */}
            <div className="w-[120px] h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySalesData}
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {categorySalesData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex-1 ml-6 space-y-3">
              {categorySalesData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-2.5 h-2.5 rounded-full mr-3" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-slate-700">{entry.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{entry.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
