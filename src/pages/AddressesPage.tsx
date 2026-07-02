import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2, 
  Home, 
  ShoppingBag, 
  Heart, 
  ShoppingCart, 
  User 
} from 'lucide-react';

interface Address {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<Partial<Address>>({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchAddresses = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAddresses(data.addresses || []);
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
        toast.error('Failed to load addresses');
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [user, navigate]);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      let updatedAddresses = [...addresses];
      const addressToSave = {
        ...currentAddress,
        id: currentAddress.id || Date.now().toString(),
        isDefault: addresses.length === 0 ? true : currentAddress.isDefault || false
      } as Address;

      if (addressToSave.isDefault) {
        updatedAddresses = updatedAddresses.map(addr => ({ ...addr, isDefault: false }));
      }

      if (currentAddress.id) {
        updatedAddresses = updatedAddresses.map(addr => 
          addr.id === currentAddress.id ? addressToSave : addr
        );
      } else {
        updatedAddresses.push(addressToSave);
      }

      await updateDoc(doc(db, 'users', user.uid), {
        addresses: updatedAddresses
      });

      setAddresses(updatedAddresses);
      setIsEditing(false);
      setCurrentAddress({});
      toast.success(currentAddress.id ? 'Address updated' : 'Address added');
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!user) return;
    try {
      const updatedAddresses = addresses.filter(addr => addr.id !== id);
      // If we deleted the default address, make the first remaining one default
      if (addresses.find(addr => addr.id === id)?.isDefault && updatedAddresses.length > 0) {
        updatedAddresses[0].isDefault = true;
      }

      await updateDoc(doc(db, 'users', user.uid), {
        addresses: updatedAddresses
      });

      setAddresses(updatedAddresses);
      toast.success('Address removed');
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error('Failed to delete address');
    }
  };

  const setAsDefault = async (id: string) => {
    if (!user) return;
    try {
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id
      }));

      await updateDoc(doc(db, 'users', user.uid), {
        addresses: updatedAddresses
      });

      setAddresses(updatedAddresses);
      toast.success('Default address updated');
    } catch (error) {
      console.error("Error setting default address:", error);
      toast.error('Failed to set default address');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      <div className="w-full max-w-md bg-slate-50 min-h-screen relative pb-24 sm:rounded-[40px] sm:shadow-xl overflow-hidden sm:my-8 sm:min-h-[850px] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-12 pb-6 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => isEditing ? setIsEditing(false) : navigate(-1)} 
              className="text-slate-800 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-[17px] font-bold text-slate-900 ml-4">
              {isEditing ? (currentAddress.id ? 'Edit Address' : 'Add New Address') : 'My Addresses'}
            </h1>
          </div>
          {!isEditing && (
            <button 
              onClick={() => {
                setCurrentAddress({});
                setIsEditing(true);
              }}
              className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-800"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        <main className="px-6 flex-1 overflow-y-auto pb-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm relative animate-pulse">
                  <div className="flex justify-between items-start mb-2">
                    <div className="h-5 bg-slate-200 rounded w-1/3 mb-2"></div>
                    <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-slate-200 rounded-xl w-24"></div>
                    <div className="h-8 bg-slate-200 rounded-xl w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : isEditing ? (
            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={currentAddress.fullName || ''}
                  onChange={e => setCurrentAddress({...currentAddress, fullName: e.target.value})}
                  className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] placeholder-slate-400 font-medium"
                  placeholder="e.g. John Doe"
                />
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={currentAddress.phone || ''}
                  onChange={e => setCurrentAddress({...currentAddress, phone: e.target.value})}
                  className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] placeholder-slate-400 font-medium"
                  placeholder="e.g. +1 234 567 8900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Street Address</label>
                <input
                  type="text"
                  required
                  value={currentAddress.street || ''}
                  onChange={e => setCurrentAddress({...currentAddress, street: e.target.value})}
                  className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] placeholder-slate-400 font-medium"
                  placeholder="e.g. 123 Main St, Apt 4B"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">City</label>
                  <input
                    type="text"
                    required
                    value={currentAddress.city || ''}
                    onChange={e => setCurrentAddress({...currentAddress, city: e.target.value})}
                    className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] placeholder-slate-400 font-medium"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">State / Province</label>
                  <input
                    type="text"
                    required
                    value={currentAddress.state || ''}
                    onChange={e => setCurrentAddress({...currentAddress, state: e.target.value})}
                    className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] placeholder-slate-400 font-medium"
                    placeholder="State"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">ZIP / Postal Code</label>
                <input
                  type="text"
                  required
                  value={currentAddress.zipCode || ''}
                  onChange={e => setCurrentAddress({...currentAddress, zipCode: e.target.value})}
                  className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] placeholder-slate-400 font-medium"
                  placeholder="ZIP Code"
                />
              </div>

              <div className="flex items-center pt-2">
                <input
                  id="defaultAddress"
                  type="checkbox"
                  checked={currentAddress.isDefault || false}
                  onChange={e => setCurrentAddress({...currentAddress, isDefault: e.target.checked})}
                  className="w-4 h-4 rounded text-[#4F46E5] focus:ring-[#4F46E5] border-slate-300"
                />
                <label htmlFor="defaultAddress" className="ml-2 block text-sm font-medium text-slate-700">
                  Set as default address
                </label>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-4 bg-[#4F46E5] hover:bg-[#4338ca] text-white text-sm font-bold rounded-2xl transition-colors"
                >
                  Save Address
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {addresses.length === 0 ? (
                <div className="text-center py-12 px-4 bg-white rounded-[24px] border border-slate-100">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">No addresses found</h3>
                  <p className="text-sm text-slate-500 mb-6">You haven't added any shipping addresses yet.</p>
                  <button 
                    onClick={() => {
                      setCurrentAddress({});
                      setIsEditing(true);
                    }}
                    className="px-6 py-3 bg-[#4F46E5] text-white text-sm font-bold rounded-xl hover:bg-[#4338ca] transition-colors"
                  >
                    Add New Address
                  </button>
                </div>
              ) : (
                addresses.map((address) => (
                  <div key={address.id} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm relative">
                    {address.isDefault && (
                      <span className="absolute top-5 right-5 bg-indigo-50 text-[#4F46E5] text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                        Default
                      </span>
                    )}
                    <div className="flex items-start space-x-3 pr-16 mb-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="w-5 h-5 text-[#4F46E5]" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-slate-900">{address.fullName}</h3>
                        <p className="text-[13px] text-slate-500 mt-1">{address.phone}</p>
                      </div>
                    </div>
                    <div className="pl-13 ml-13">
                      <p className="text-[14px] text-slate-600 leading-relaxed pl-13">
                        {address.street}<br />
                        {address.city}, {address.state} {address.zipCode}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-slate-50 pl-13">
                      <button 
                        onClick={() => {
                          setCurrentAddress(address);
                          setIsEditing(true);
                        }}
                        className="text-[13px] font-semibold text-[#4F46E5] flex items-center hover:text-[#4338ca]"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteAddress(address.id)}
                        className="text-[13px] font-semibold text-red-500 flex items-center hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                      </button>
                      {!address.isDefault && (
                        <button 
                          onClick={() => setAsDefault(address.id)}
                          className="text-[13px] font-semibold text-slate-500 flex items-center hover:text-slate-700 ml-auto"
                        >
                          Set Default
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
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
          <Link to="/account" className="flex flex-col items-center text-slate-900 transition-colors">
            <User className="w-6 h-6 mb-1 text-slate-900" />
            <span className="text-[10px] font-bold">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
