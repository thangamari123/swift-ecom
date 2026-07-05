import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { Plus, X, Mouse, Cable, Headphones, Watch, Smartphone, Gamepad2, Package } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAdminRoleGuard } from '@/hooks/useAdminRoleGuard';
import { ImageUploader } from '@/components/ui/ImageUploader';

export default function AdminCategories() {
  useAdminRoleGuard(['Administrator', 'Manager', 'Editor']);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { register, handleSubmit, reset, setValue, watch } = useForm();

  useEffect(() => {
    const unsubscribeCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.log('Categories listener error:', error);
    });

    const unsubscribeProds = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.log('Products listener error:', error);
    });

    return () => {
      unsubscribeCats();
      unsubscribeProds();
    };
  }, []);

  const handleEdit = (category: any) => {
    setEditingId(category.id);
    setValue('mainCategory', category.mainCategory || 'Other');
    setValue('name', category.name);
    setValue('image', category.image || '');
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = async (data: any) => {
    try {
      if (editingId) {
        await updateDoc(doc(db, 'categories', editingId), {
          mainCategory: data.mainCategory || 'Other',
          name: data.name,
          image: data.image || '',
        });
        toast.success('Category updated');
      } else {
        await addDoc(collection(db, 'categories'), {
          mainCategory: data.mainCategory || 'Other',
          name: data.name,
          image: data.image || '',
        });
        toast.success('Category added');
      }
      handleCancel();
    } catch (e) {
      toast.error(editingId ? 'Failed to update category' : 'Failed to add category');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        toast.success('Category deleted');
        handleCancel();
      } catch (e) {
        toast.error('Failed to delete category');
      }
    }
  };

  const getCategoryIcon = (name: string, color: string) => {
    const n = name.toLowerCase();
    if (n.includes('electronic')) return <Mouse className={`w-6 h-6 ${color}`} />;
    if (n.includes('accessor')) return <Cable className={`w-6 h-6 ${color}`} />;
    if (n.includes('audio')) return <Headphones className={`w-6 h-6 ${color}`} />;
    if (n.includes('wearable')) return <Watch className={`w-6 h-6 ${color}`} />;
    if (n.includes('mobile') || n.includes('phone')) return <Smartphone className={`w-6 h-6 ${color}`} />;
    if (n.includes('game') || n.includes('gaming')) return <Gamepad2 className={`w-6 h-6 ${color}`} />;
    return <Package className={`w-6 h-6 ${color}`} />;
  };

  const getCategoryColors = (index: number) => {
    const colors = [
      { bg: 'bg-[#6366f1]/10', text: 'text-[#6366f1]' },
      { bg: 'bg-[#3b82f6]/10', text: 'text-[#3b82f6]' },
      { bg: 'bg-[#f59e0b]/10', text: 'text-[#f59e0b]' },
      { bg: 'bg-[#10b981]/10', text: 'text-[#10b981]' },
      { bg: 'bg-[#4f46e5]/10', text: 'text-[#4f46e5]' },
      { bg: 'bg-[#8b5cf6]/10', text: 'text-[#8b5cf6]' },
    ];
    return colors[index % colors.length];
  };

  const getProductCount = (categoryName: string) => {
    return products.filter(p => p.category === categoryName).length;
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto md:max-w-none pb-4">
      {/* Search and Add Button area can go here if needed, but layout has header */}
      <div className="flex justify-between items-center mb-2 md:hidden">
         {/* Mobile extra header if needed, but AdminLayout has back arrow. Let's just add the Plus button to the right if not in header */}
      </div>

      <div className="flex justify-end mb-4">
        <button 
          onClick={() => {
            if (isAdding) {
              handleCancel();
            } else {
              reset();
              setEditingId(null);
              setIsAdding(true);
            }
          }}
          className="flex items-center justify-center w-12 h-12 bg-[#3b41e3] text-white rounded-xl hover:bg-[#2e34e5] transition-colors shadow-sm"
        >
          {isAdding ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
          <h3 className="text-lg font-bold mb-4">{editingId ? 'Edit Category' : 'Add New Category'}</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Main Category</label>
              <select {...register('mainCategory', { required: true })} className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-[#4F46E5] focus:ring-[#4F46E5] sm:text-sm p-3 border font-medium bg-slate-50">
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Kid">Kid</option>
                <option value="Home Decorate">Home Decorate</option>
                <option value="Watch">Watch</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Sub Category Name</label>
              <input {...register('name', { required: true })} className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-[#4F46E5] focus:ring-[#4F46E5] sm:text-sm p-3 border font-medium bg-slate-50" placeholder="e.g. Shirts, Sneakers" />
            </div>
            <div>
              <input type="hidden" {...register('image')} />
              <ImageUploader 
                label="Category Image (Optional)"
                folder="categories"
                value={watch('image')}
                onChange={(url) => setValue('image', url, { shouldValidate: true, shouldDirty: true })}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 py-3 bg-[#3b41e3] text-white rounded-xl hover:bg-[#2e34e5] font-bold shadow-sm transition-colors">
                {editingId ? 'Update' : 'Save'}
              </button>
              {editingId && (
                <button type="button" onClick={() => handleDelete(editingId)} className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-bold shadow-sm transition-colors">
                  Delete
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {categories.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-medium">
            No categories found.
          </div>
        ) : (
          categories.map((cat, index) => {
            const colors = getCategoryColors(index);
            return (
              <div 
                key={cat.id} 
                onClick={() => handleEdit(cat)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-50 flex items-center gap-4 hover:border-slate-200 transition-colors cursor-pointer"
              >
                <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden ${colors.bg}`}>
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    getCategoryIcon(cat.name, colors.text)
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-indigo-600 mb-0.5 uppercase tracking-wider">{cat.mainCategory || 'Other'}</div>
                  <h4 className="text-[17px] font-bold text-slate-900 truncate mb-0.5">
                    {cat.name}
                  </h4>
                  <div className="text-sm text-slate-500 font-medium">
                    {getProductCount(cat.name)} Products
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <span className="text-sm font-bold text-emerald-500">
                    Active
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
