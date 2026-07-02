import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-toastify';
import { ArrowLeft, Plus, Edit2, Trash2, X, Shield, UserCog, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminRoleGuard } from '@/hooks/useAdminRoleGuard';

export default function AdminUsers() {
  useAdminRoleGuard(['Administrator']);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Administrator',
    status: 'Active',
    avatar: ''
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'adminUsers'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(data);
      setLoading(false);
    }, (error) => {
      console.log('AdminUsers listener error (likely during logout):', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenModal = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'Administrator',
        status: user.status || 'Active',
        avatar: user.avatar || ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'Administrator',
        status: 'Active',
        avatar: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateDoc(doc(db, 'adminUsers', editingUser.id), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        toast.success('Admin user updated successfully');
      } else {
        const newRef = doc(collection(db, 'adminUsers'));
        await setDoc(newRef, {
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        toast.success('Admin user added successfully');
      }
      handleCloseModal();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save admin user');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this admin?')) {
      try {
        await deleteDoc(doc(db, 'adminUsers', id));
        toast.success('Admin removed');
      } catch (error) {
        toast.error('Failed to remove admin');
      }
    }
  };

  const toggleStatus = async (user: any) => {
    try {
      const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
      await updateDoc(doc(db, 'adminUsers', user.id), { status: newStatus });
      toast.success(`Status changed to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-500 font-medium">Loading admins...</div>;

  return (
    <div className="pb-24 md:pb-8">
      {/* Header matching screenshot exactly */}
      <div className="flex items-center justify-between mb-8 px-2 md:px-0 mt-4 md:mt-0">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4 text-slate-800 hover:bg-slate-100 p-2 rounded-full md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Admin Users</h1>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="w-10 h-10 bg-[#3b41e3] hover:bg-[#2e34e5] text-white rounded-xl flex items-center justify-center shadow-md transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Admin List */}
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
        {users.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <UserCog className="w-12 h-12 mb-4 text-slate-300" />
            <p>No admin users found.</p>
            <p className="text-sm mt-1">Click the + button to add one.</p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="p-4 md:p-5 flex items-center justify-between group hover:bg-slate-50 transition-colors">
              <div className="flex items-center flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=f1f5f9&color=475569`}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <h3 className="text-[15px] font-bold text-slate-900 truncate">{user.name}</h3>
                  <p className="text-[13px] text-slate-500 truncate mt-0.5">{user.email}</p>
                  <p className="text-[12px] text-slate-400 font-medium mt-0.5">{user.role}</p>
                </div>
              </div>

              <div className="flex flex-col items-end pl-4">
                <button
                  onClick={() => toggleStatus(user)}
                  className="flex items-center group/status"
                >
                  <span className={`text-[13px] font-bold ${user.status === 'Active' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {user.status}
                  </span>
                  <RefreshCw className={`w-3 h-3 ml-1.5 opacity-0 md:group-hover:opacity-100 md:group-hover/status:opacity-100 transition-opacity ${user.status === 'Active' ? 'text-emerald-500' : 'text-rose-500'}`} />
                </button>

                <div className="flex items-center gap-2 mt-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenModal(user)}
                    className="text-slate-400 hover:text-[#3b41e3] transition-colors p-1"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingUser ? 'Edit Admin User' : 'Add Admin User'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b41e3] focus:border-transparent transition-all"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b41e3] focus:border-transparent transition-all"
                    placeholder="e.g. admin@shoply.com"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Role</label>
                  <div className="relative">
                    <select
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b41e3] focus:border-transparent transition-all appearance-none cursor-pointer"
                    >
                      <option value="Administrator">Administrator</option>
                      <option value="Manager">Manager</option>
                      <option value="Editor">Editor</option>
                      <option value="Support">Support</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <Shield className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Status</label>
                  <div className="flex gap-4">
                    <label className="flex items-center flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="Active"
                        checked={formData.status === 'Active'}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                        className="sr-only"
                      />
                      <div className={`flex-1 text-center py-2.5 rounded-xl text-sm font-bold border transition-colors ${formData.status === 'Active' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                        Active
                      </div>
                    </label>
                    <label className="flex items-center flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="Inactive"
                        checked={formData.status === 'Inactive'}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                        className="sr-only"
                      />
                      <div className={`flex-1 text-center py-2.5 rounded-xl text-sm font-bold border transition-colors ${formData.status === 'Inactive' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                        Inactive
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Avatar URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.avatar}
                    onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b41e3] focus:border-transparent transition-all"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  className="w-full bg-[#3b41e3] hover:bg-[#2e34e5] text-white font-bold py-3.5 px-4 rounded-xl transition-colors shadow-md"
                >
                  {editingUser ? 'Save Changes' : 'Add Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
