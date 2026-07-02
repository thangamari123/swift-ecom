import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, updateDoc, onSnapshot, addDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { Search, SlidersHorizontal, Package, ArrowLeft, User, Mail, Phone, MapPin, CreditCard, Download, Printer } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAdminRoleGuard } from '@/hooks/useAdminRoleGuard';

export default function AdminOrders() {
  useAdminRoleGuard(['Administrator', 'Manager', 'Support']);
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Search and Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // View Details Modal
  const [viewingOrder, setViewingOrder] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        let dateVal = docData.createdAt;
        if (dateVal && dateVal.toDate) {
          dateVal = dateVal.toDate().toISOString();
        } else if (dateVal instanceof Date) {
          dateVal = dateVal.toISOString();
        }
        return { id: doc.id, ...docData, createdAt: dateVal };
      });
      data.sort((a: any, b: any) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      setOrders(data);
      setFilteredOrders(data);
      setLoading(false);
    }, (error) => {
      console.log('Orders listener error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // ✅ No searchParams in deps — listener runs once

  // Separate effect: open order detail if ?id= is in the URL
  useEffect(() => {
    const orderIdParam = searchParams.get('id');
    if (orderIdParam && orders.length > 0) {
      const orderToView = orders.find((o: any) => o.id === orderIdParam);
      if (orderToView) setViewingOrder(orderToView);
    }
  }, [searchParams, orders]);

  useEffect(() => {
    let result = orders;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.id.toLowerCase().includes(term) || 
        (order.customerDetails?.fullName || '').toLowerCase().includes(term) ||
        (order.customerDetails?.email || '').toLowerCase().includes(term)
      );
    }
    
    if (statusFilter !== 'All') {
      result = result.filter(order => order.status === statusFilter);
    }
    
    setFilteredOrders(result);
  }, [searchTerm, statusFilter, orders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-orange-100 text-orange-600 border border-orange-200';
      case 'Processing': return 'bg-blue-100 text-blue-600 border border-blue-200';
      case 'Packed': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'Shipped': return 'bg-purple-100 text-purple-600 border border-purple-200';
      case 'Delivered': return 'bg-green-100 text-green-600 border border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-600 border border-red-200';
      default: return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  const handleStatusChange = async (order: any, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), { status: newStatus });
      
      // Create a notification for the customer if they have an account
      if (order.userId) {
        await addDoc(collection(db, 'notifications'), {
          userId: order.userId,
          title: 'Order Status Updated',
          message: `Your order #${order.id.slice(0, 8)} is now ${newStatus}.`,
          type: 'order_update',
          orderId: order.id,
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      // Trigger Email Extension
      if (order.customerDetails?.email) {
        await addDoc(collection(db, 'mail'), {
          to: order.customerDetails.email,
          message: {
            subject: `Order Status Updated: ${newStatus}`,
            html: `
              <h2>Hi ${order.customerDetails.fullName || 'Customer'},</h2>
              <p>Your order (<strong>#${order.id.slice(0, 8)}</strong>) status has been updated to: <strong>${newStatus}</strong>.</p>
              <p>Thank you for shopping with us!</p>
            `
          }
        });
      }
      
      toast.success('Order status updated');
    } catch (e) {
      toast.error('Failed to update order');
    }
  };

  const handleDownloadCSV = () => {
    if (filteredOrders.length === 0) {
      toast.info('No orders to download');
      return;
    }

    const headers = ['Order ID', 'Date', 'Customer Name', 'Email', 'Phone', 'Total', 'Status', 'Payment Method'];
    
    const csvRows = [headers.join(',')];
    
    filteredOrders.forEach(order => {
      const id = order.id;
      const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '';
      const name = `"${order.customerDetails?.fullName || order.shippingAddress?.fullName || 'Guest'}"`;
      const email = `"${order.customerDetails?.email || order.shippingAddress?.email || ''}"`;
      const phone = `"${order.customerDetails?.phone || order.shippingAddress?.phone || ''}"`;
      const total = order.total || 0;
      const status = order.status || 'Pending';
      const paymentMethod = order.paymentMethod || '';
      
      csvRows.push([id, date, name, email, phone, total, status, paymentMethod].join(','));
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Downloaded CSV successfully');
  };

  const handlePrintInvoice = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print invoices');
      return;
    }
    
    const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';
    const customerName = order.customerDetails?.fullName || order.shippingAddress?.fullName || 'Guest';
    const email = order.customerDetails?.email || order.shippingAddress?.email || '';
    const phone = order.customerDetails?.phone || order.shippingAddress?.phone || '';
    const address = order.shippingAddress?.address || order.shippingAddress?.street || '';
    const city = order.shippingAddress?.city || '';
    const zip = order.shippingAddress?.zip || order.shippingAddress?.zipCode || '';
    
    const itemsHtml = order.items?.map((item: any) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
          <div style="font-weight: 600;">${item.name}</div>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
      </tr>
    `).join('') || '';

    const discountHtml = order.discount > 0 ? `
      <div class="total-row" style="color: #16a34a;">
        <span>Discount</span>
        <span>-₹${(order.discount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
      </div>
    ` : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${order.id.slice(0, 8)}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #333; line-height: 1.5; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
          .header h1 { margin: 0; color: #111; font-size: 28px; }
          .header p { margin: 4px 0; color: #666; }
          .info-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .info-block { flex: 1; }
          .info-block h3 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #888; }
          .info-block p { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th { text-align: left; padding: 12px 0; border-bottom: 2px solid #eee; color: #888; font-weight: 600; font-size: 14px; text-transform: uppercase; }
          .total-section { width: 300px; margin-left: auto; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .total-row.final { font-weight: bold; font-size: 18px; border-bottom: none; border-top: 2px solid #eee; padding-top: 12px; margin-top: 4px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>INVOICE</h1>
            <p>Order #${order.id}</p>
          </div>
          <div style="text-align: right;">
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Status:</strong> ${order.status || 'Pending'}</p>
            <p><strong>Payment:</strong> ${order.paymentMethod || 'N/A'}</p>
          </div>
        </div>
        
        <div class="info-section">
          <div class="info-block">
            <h3>Billed To</h3>
            <p><strong>${customerName}</strong></p>
            <p>${email}</p>
            <p>${phone}</p>
          </div>
          <div class="info-block" style="text-align: right;">
            <h3>Shipped To</h3>
            <p>${address}</p>
            <p>${city} ${zip}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div class="total-section">
          <div class="total-row">
            <span>Subtotal</span>
            <span>₹${order.items?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          <div class="total-row">
            <span>Shipping</span>
            <span>₹50</span>
          </div>
          ${discountHtml}
          <div class="total-row final">
            <span>Total</span>
            <span>₹${(order.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  const tabs = ['All', 'Pending', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-500 font-medium">Loading orders...</div>;

  return (
    <div className="space-y-6 max-w-lg mx-auto md:max-w-none pb-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search orders..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 pr-4 py-3 border border-slate-100 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] w-full text-sm font-medium"
          />
        </div>
        <button onClick={handleDownloadCSV} className="flex-shrink-0 flex items-center justify-center px-4 h-12 bg-white text-slate-600 border border-slate-100 rounded-xl hover:bg-slate-50 shadow-sm transition-colors text-sm font-bold">
          <Download className="w-4 h-4 mr-2 hidden sm:block" />
          CSV
        </button>
        <button className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-white text-slate-600 border border-slate-100 rounded-xl hover:bg-slate-50 shadow-sm">
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
              statusFilter === tab 
                ? 'bg-[#3b41e3] text-white shadow-sm' 
                : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-medium">
            No orders found.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} onClick={() => setViewingOrder(order)} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-50 flex items-center gap-4 cursor-pointer hover:border-slate-200 transition-colors">
              <div className="flex-shrink-0 w-12 h-12 bg-[#f0f4ff] rounded-full flex items-center justify-center text-[#4F46E5]">
                <Package className="w-6 h-6" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-bold text-slate-900 truncate mb-0.5">#{order.id.slice(0, 8)}</h4>
                <div className="text-sm text-slate-400 font-medium mb-0.5">
                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : 'N/A'}
                </div>
                <div className="text-sm text-slate-500 font-medium truncate">
                  {order.customerDetails?.fullName || order.shippingAddress?.fullName || 'Guest'}
                </div>
              </div>
              
              <div className="flex-shrink-0 flex flex-col items-end gap-1 text-right">
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status || 'Pending')}`}>
                  {order.status || 'Pending'}
                </span>
                <span className="text-base font-black text-slate-900 mt-1">
                  ₹{((order.total || 0) * 83).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Details Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-[60] bg-white overflow-y-auto flex flex-col md:p-8">
            <div className="bg-white md:rounded-2xl md:shadow-xl md:max-w-md md:mx-auto w-full min-h-screen md:min-h-0 flex flex-col relative">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 md:pt-4 border-b border-slate-100/0">
                <div className="flex items-center">
                  <button 
                    onClick={() => {
                      setViewingOrder(null);
                      if (searchParams.get('id')) {
                        searchParams.delete('id');
                        setSearchParams(searchParams);
                      }
                    }} 
                    className="mr-3 p-2 -ml-2 text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-[17px] font-bold text-slate-900">Order Details</h2>
                </div>
                <button 
                  onClick={() => handlePrintInvoice(viewingOrder)}
                  className="p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-full transition-colors"
                  title="Print Invoice"
                >
                  <Printer className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 pb-32">
                 {/* Order ID & Status */}
                 <div className="flex justify-between items-start mb-1">
                   <h3 className="text-xl font-bold text-slate-900">#{viewingOrder.id.slice(0, 8)}</h3>
                   <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${getStatusColor(viewingOrder.status || 'Pending')}`}>
                     {viewingOrder.status || 'Pending'}
                   </span>
                 </div>
                 <p className="text-sm text-slate-500 font-medium mb-6">
                    {viewingOrder.createdAt ? new Date(viewingOrder.createdAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '') : 'N/A'}
                 </p>

                 {/* Customer Info */}
                 <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-4 shadow-sm">
                   <h4 className="text-[13px] font-bold text-slate-900 mb-3">Customer Information</h4>
                   <div className="space-y-3">
                     <div className="flex items-center text-sm">
                       <User className="w-4 h-4 text-slate-400 mr-3" />
                       <span className="text-slate-700 font-medium">{viewingOrder.customerDetails?.fullName || viewingOrder.shippingAddress?.fullName}</span>
                     </div>
                     <div className="flex items-center text-sm">
                       <Mail className="w-4 h-4 text-slate-400 mr-3" />
                       <span className="text-slate-700 font-medium">{viewingOrder.customerDetails?.email || viewingOrder.shippingAddress?.email}</span>
                     </div>
                     <div className="flex items-center text-sm">
                       <Phone className="w-4 h-4 text-slate-400 mr-3" />
                       <span className="text-slate-700 font-medium">{viewingOrder.customerDetails?.phone || viewingOrder.shippingAddress?.phone || 'No phone'}</span>
                     </div>
                   </div>
                 </div>

                 {/* Shipping Address */}
                 <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-4 shadow-sm">
                   <h4 className="text-[13px] font-bold text-slate-900 mb-3">Shipping Address</h4>
                   <div className="flex items-start text-sm">
                     <MapPin className="w-4 h-4 text-slate-400 mr-3 mt-0.5" />
                     <div className="text-slate-700 font-medium space-y-1">
                       <p>{viewingOrder.shippingAddress?.address}</p>
                       <p>{viewingOrder.shippingAddress?.city} - {viewingOrder.shippingAddress?.zipCode}</p>
                       <p>{viewingOrder.shippingAddress?.country || 'India'}</p>
                     </div>
                   </div>
                 </div>

                 {/* Order Items */}
                 <div className="mb-6">
                   <h4 className="text-[13px] font-bold text-slate-900 mb-3 px-1">Order Items</h4>
                   <div className="space-y-4">
                     {viewingOrder.items?.map((item: any, idx: number) => (
                       <div key={idx} className="flex items-center gap-3 px-1">
                         <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                           <img src={item.imageUrl || 'https://via.placeholder.com/48'} alt={item.name} className="w-full h-full object-cover" />
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                           <p className="text-xs text-slate-500 font-medium mt-0.5">Qty. {item.quantity}</p>
                         </div>
                         <div className="text-right flex-shrink-0">
                           <p className="text-sm font-bold text-slate-900">₹{(item.price * item.quantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                           <p className="text-xs text-slate-500 font-medium mt-0.5">Qty. {item.quantity}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>

                 {/* Payment Method */}
                 <div className="mb-6">
                   <h4 className="text-[13px] font-bold text-slate-900 mb-3 px-1">Payment Method</h4>
                   <div className="flex items-center px-1">
                     <CreditCard className="w-4 h-4 text-slate-300 mr-2" />
                     <span className="text-sm text-slate-700 font-medium">{viewingOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : viewingOrder.paymentMethod}</span>
                   </div>
                 </div>

                 {/* Total Amount */}
                  <div className="flex justify-between items-center px-1 mb-8">
                    <span className="text-[15px] font-bold text-slate-900">Total Amount</span>
                    <span className="text-lg font-black text-slate-900">₹{(viewingOrder.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
              </div>
              
              {/* Bottom Fixed Action — Visible styled status selector */}
              <div className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Update Order Status</label>
                <select
                  value={viewingOrder.status || 'Pending'}
                  onChange={(e) => {
                    handleStatusChange(viewingOrder, e.target.value);
                    setViewingOrder({...viewingOrder, status: e.target.value});
                  }}
                  className="w-full bg-[#3b41e3] hover:bg-[#2e34e5] transition-colors text-white rounded-xl py-3.5 px-4 font-bold text-sm outline-none cursor-pointer appearance-none shadow-sm"
                >
                  <option value="Pending" className="text-slate-900 bg-white">⏳ Pending</option>
                  <option value="Processing" className="text-slate-900 bg-white">🔄 Processing</option>
                  <option value="Packed" className="text-slate-900 bg-white">📦 Packed</option>
                  <option value="Shipped" className="text-slate-900 bg-white">🚚 Shipped</option>
                  <option value="Delivered" className="text-slate-900 bg-white">✅ Delivered</option>
                  <option value="Cancelled" className="text-slate-900 bg-white">❌ Cancelled</option>
                </select>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}
