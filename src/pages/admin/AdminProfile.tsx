import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Lock, Bell, Globe, LogOut, ChevronRight, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function AdminProfile() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      const fetchAdminData = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setAdminData(docSnap.data());
          }
        } catch (error) {
          console.error("Error fetching admin data:", error);
        }
      };
      fetchAdminData();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error: any) {
      toast.error('Failed to log out: ' + error.message);
    }
  };

  const handleEditProfile = () => {
    toast.info('Edit Profile coming soon!');
  };

  return (
    <div className="max-w-lg mx-auto md:max-w-none pb-8 space-y-6">
      {/* Profile Header section handled in Layout generally, but we can add back button if needed */}

      {/* Profile Info */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center space-x-5">
        <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Admin" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-2xl font-bold">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{adminData?.fullName || user?.displayName || 'Admin User'}</h2>
          <p className="text-sm text-slate-500 mb-3">{user?.email}</p>
          <button 
            onClick={handleEditProfile}
            className="px-4 py-1.5 bg-[#4F46E5] text-white text-sm font-semibold rounded-xl hover:bg-[#4338ca] transition-colors"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Settings Options */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="divide-y divide-slate-100/60 p-2">
          
          <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-2xl group">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-slate-100 transition-all">
                <Lock className="w-5 h-5" />
              </div>
              <span className="text-[15px] font-semibold text-slate-800">Change Password</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-2xl group">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-slate-100 transition-all">
                <Bell className="w-5 h-5" />
              </div>
              <span className="text-[15px] font-semibold text-slate-800">Notification Settings</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-2xl group">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-slate-100 transition-all">
                <Globe className="w-5 h-5" />
              </div>
              <span className="text-[15px] font-semibold text-slate-800">Language</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-500">English</span>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
          </button>
          
          <button onClick={() => navigate('/admin/settings')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-2xl group">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-slate-100 transition-all">
                <Settings className="w-5 h-5" />
              </div>
              <span className="text-[15px] font-semibold text-slate-800">Settings</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>

        </div>
      </div>

      {/* Logout */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden p-2">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors rounded-2xl group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-red-100 transition-all">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="text-[15px] font-semibold text-red-500">Logout</span>
          </div>
          <ChevronRight className="w-5 h-5 text-red-400 group-hover:text-red-500 transition-colors" />
        </button>
      </div>

    </div>
  );
}
