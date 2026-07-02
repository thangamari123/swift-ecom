import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { Save, Store, ChevronRight, Briefcase, Package, CheckSquare, Link as LinkIcon, User, ArrowLeft } from 'lucide-react';
import { useAdminRoleGuard } from '@/hooks/useAdminRoleGuard';

export default function AdminSettings() {
  useAdminRoleGuard(['Administrator']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeView, setActiveView] = useState<string | null>(null);
  
  const [settings, setSettings] = useState({
    storeName: 'SwiftStore',
    logoUrl: '',
    supportEmail: 'support@swiftstore.com',
    supportPhone: '+1 (555) 123-4567',
    taxRate: 8.5,
    flatShippingRate: 15.00,
    freeShippingThreshold: 100.00,
    enableStripe: true,
    enablePayPal: true,
    enableCOD: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'store');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSettings({ ...settings, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching settings", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'store'), settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-500">Loading settings...</div>;

  const menuItems = [
    { id: 'store', label: 'Store Settings', icon: Store },
    { id: 'payment', label: 'Payment Methods', icon: Briefcase },
    { id: 'shipping', label: 'Shipping Settings', icon: Package },
    { id: 'email', label: 'Email Settings', icon: CheckSquare },
    { id: 'social', label: 'Social Links', icon: LinkIcon },
    { id: 'notifications', label: 'Notifications', icon: User },
  ];

  if (activeView) {
    return (
      <div className="space-y-6 max-w-lg mx-auto md:max-w-none">
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center">
            <button onClick={() => setActiveView(null)} className="mr-3 p-2 hover:bg-slate-50 rounded-full text-slate-600">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 capitalize">{menuItems.find(m => m.id === activeView)?.label}</h2>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-[#4F46E5] text-white rounded-xl hover:bg-[#4338ca] disabled:opacity-70 text-sm font-semibold transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 space-y-5">
          {activeView === 'store' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Store Name</label>
                <input 
                  type="text" 
                  name="storeName" 
                  value={settings.storeName} 
                  onChange={handleChange}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 shadow-sm focus:border-[#4F46E5] focus:ring-[#4F46E5] sm:text-sm p-3 border outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Store Logo URL</label>
                <div className="flex items-center space-x-4 mb-2">
                  {settings.logoUrl && (
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                      <img src={settings.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                  <input 
                    type="url" 
                    name="logoUrl" 
                    value={settings.logoUrl || ''} 
                    onChange={handleChange}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 rounded-xl border-slate-200 bg-slate-50 shadow-sm focus:border-[#4F46E5] focus:ring-[#4F46E5] sm:text-sm p-3 border outline-none" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Support Email</label>
                <input 
                  type="email" 
                  name="supportEmail" 
                  value={settings.supportEmail} 
                  onChange={handleChange}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 shadow-sm focus:border-[#4F46E5] focus:ring-[#4F46E5] sm:text-sm p-3 border outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Support Phone</label>
                <input 
                  type="text" 
                  name="supportPhone" 
                  value={settings.supportPhone} 
                  onChange={handleChange}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 shadow-sm focus:border-[#4F46E5] focus:ring-[#4F46E5] sm:text-sm p-3 border outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Default Tax Rate (%)</label>
                <input 
                  type="number" 
                  step="0.01"
                  name="taxRate" 
                  value={settings.taxRate} 
                  onChange={handleChange}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 shadow-sm focus:border-[#4F46E5] focus:ring-[#4F46E5] sm:text-sm p-3 border outline-none" 
                />
                <p className="mt-1.5 text-xs font-medium text-slate-500">Applied to all taxable products during checkout.</p>
              </div>
            </div>
          )}

          {activeView === 'payment' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-900">Credit/Debit Card (Stripe)</p>
                  <p className="text-xs text-slate-500 mt-0.5">Accept major cards</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="enableStripe" checked={settings.enableStripe} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4F46E5]"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-900">PayPal</p>
                  <p className="text-xs text-slate-500 mt-0.5">Fast and secure checkout</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="enablePayPal" checked={settings.enablePayPal} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4F46E5]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-900">Cash on Delivery (COD)</p>
                  <p className="text-xs text-slate-500 mt-0.5">Pay upon receiving</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="enableCOD" checked={settings.enableCOD} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4F46E5]"></div>
                </label>
              </div>
            </div>
          )}

          {activeView === 'shipping' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Flat Shipping Rate (₹)</label>
                <input 
                  type="number" 
                  step="0.01"
                  name="flatShippingRate" 
                  value={settings.flatShippingRate} 
                  onChange={handleChange}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 shadow-sm focus:border-[#4F46E5] focus:ring-[#4F46E5] sm:text-sm p-3 border outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Free Shipping Threshold (₹)</label>
                <input 
                  type="number" 
                  step="0.01"
                  name="freeShippingThreshold" 
                  value={settings.freeShippingThreshold} 
                  onChange={handleChange}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 shadow-sm focus:border-[#4F46E5] focus:ring-[#4F46E5] sm:text-sm p-3 border outline-none" 
                />
                <p className="mt-1.5 text-xs font-medium text-slate-500">Orders over this amount ship free.</p>
              </div>
            </div>
          )}

          {['email', 'social', 'notifications'].includes(activeView) && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Store className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium text-sm">This settings section is coming soon.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto md:max-w-none pb-8">
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="divide-y divide-slate-100/60 p-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-2xl group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-slate-100 transition-all">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[15px] font-semibold text-slate-800">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
