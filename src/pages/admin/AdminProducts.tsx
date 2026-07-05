import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { Plus, Trash2, Search, ArrowLeft, CloudUpload, ChevronDown, ChevronUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAdminRoleGuard } from '@/hooks/useAdminRoleGuard';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { generateSlug } from '@/utils/slug';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  description: string;
  imageUrl: string;
  videoUrl?: string;
  images?: string[];
  sizes?: string[];
  status: string;
  trending?: boolean;
  newArrival?: boolean;
  slug?: string;
}

export default function AdminProducts() {
  useAdminRoleGuard(['Administrator', 'Manager', 'Editor']);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const categories = ['Men', 'Women', 'Kid', 'Home Decorate', 'Watch'];
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter] = useState('All');
  const [uploading, setUploading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Men: true,
    Women: true,
    Kid: true,
    'Home Decorate': true,
    Watch: true,
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);
      setFilteredProducts(data);
    }, (error) => {
      console.log('Error fetching products:', error);
    });

    return () => { unsubscribe(); };
  }, []);

  useEffect(() => {
    let result = products;
    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (categoryFilter !== 'All') {
      result = result.filter(p => p.category === categoryFilter);
    }
    setFilteredProducts(result);
  }, [searchTerm, categoryFilter, products]);

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setValue('name', product.name);
    setValue('category', product.category);
    setValue('price', product.price);
    setValue('stock', product.stock);
    setValue('description', product.description || '');
    setValue('imageUrl', product.imageUrl || (product.images?.[0] || ''));
    setValue('videoUrl', product.videoUrl || '');
    setValue('image2', product.images?.[1] || '');
    setValue('image3', product.images?.[2] || '');
    setValue('image4', product.images?.[3] || '');
    setValue('image5', product.images?.[4] || '');
    setValue('sizes', product.sizes?.join(', ') || '');
    setValue('status', product.status || 'Active');
    setValue('trending', product.trending || false);
    setValue('newArrival', product.newArrival || false);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = async (data: any) => {
    setUploading(true);
    try {
      const imagesArray = [data.imageUrl, data.image2, data.image3, data.image4, data.image5].filter(Boolean);
      const sizesArray = data.sizes ? data.sizes.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

      const productData = {
        name: data.name,
        price: parseFloat(data.price),
        category: data.category,
        stock: parseInt(data.stock),
        description: data.description || '',
        imageUrl: data.imageUrl || imagesArray[0] || '',
        videoUrl: data.videoUrl || '',
        images: imagesArray,
        sizes: sizesArray,
        status: data.status || 'Active',
        trending: !!data.trending,
        newArrival: !!data.newArrival,
        slug: generateSlug(data.name),
      };

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), productData);
        toast.success('Product updated successfully');
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: new Date().toISOString()
        });
        toast.success('Product added successfully');
      }

      handleCancel();
    } catch (e: any) {
      console.error("Product save error:", e);
      toast.error(editingId ? 'Failed to update product: ' + e.message : 'Failed to add product: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        toast.success('Product deleted');
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  if (isAdding) {
    return (
      <div className="bg-white min-h-[calc(100vh-4rem)] flex flex-col -mx-4 -my-4 md:-mx-8 md:-my-8 px-4 py-4 md:px-8 md:py-8 absolute md:static inset-0 z-50 md:z-auto">
        <div className="flex items-center mb-6 pt-2">
          <button onClick={handleCancel} className="mr-4 p-2 -ml-2 text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Product' : 'Add Product'}</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 flex-1 pb-20 md:pb-0 max-w-2xl mx-auto w-full">
          {/* Upload Area */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 border-b pb-2 mb-4">Product Images</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="hidden" {...register('imageUrl')} />
                <input type="hidden" {...register('image2')} />
                <input type="hidden" {...register('image3')} />
                <input type="hidden" {...register('image4')} />
                <input type="hidden" {...register('image5')} />
                <ImageUploader label="Main Image" folder="products" value={watch('imageUrl')} onChange={(url) => setValue('imageUrl', url, { shouldValidate: true, shouldDirty: true })} />
                <ImageUploader label="Image 2" folder="products" value={watch('image2')} onChange={(url) => setValue('image2', url, { shouldValidate: true, shouldDirty: true })} />
                <ImageUploader label="Image 3" folder="products" value={watch('image3')} onChange={(url) => setValue('image3', url, { shouldValidate: true, shouldDirty: true })} />
                <ImageUploader label="Image 4" folder="products" value={watch('image4')} onChange={(url) => setValue('image4', url, { shouldValidate: true, shouldDirty: true })} />
                <ImageUploader label="Image 5" folder="products" value={watch('image5')} onChange={(url) => setValue('image5', url, { shouldValidate: true, shouldDirty: true })} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 border-b pb-2 mb-4">Product Video</h3>
              <input {...register('videoUrl')} placeholder="Video URL (For Reels) e.g., YouTube or Instagram URL" className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-[#4F46E5] focus:ring-[#4F46E5] sm:text-sm p-3 border font-medium bg-slate-50" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">Product Name</label>
              <input {...register('name', { required: true })} placeholder="Enter product name" className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-[#4F46E5] focus:ring-[#4F46E5] sm:text-sm p-3 border font-medium" />
              {errors.name && <span className="text-red-500 text-xs font-medium mt-1 block">Name is required</span>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">Category</label>
              <select {...register('category', { required: true })} className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-[#4F46E5] focus:ring-[#4F46E5] sm:text-sm p-3 border font-medium text-slate-700 bg-white">
                <option value="" disabled>Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <span className="text-red-500 text-xs font-medium mt-1 block">Category is required</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1.5">Price (₹)</label>
                <input type="number" step="0.01" {...register('price', { required: true })} placeholder="Enter price" className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-[#4F46E5] focus:ring-[#4F46E5] sm:text-sm p-3 border font-medium" />
                {errors.price && <span className="text-red-500 text-xs font-medium mt-1 block">Price is required</span>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1.5">Stock</label>
                <input type="number" {...register('stock', { required: true })} placeholder="Enter stock quantity" className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-[#4F46E5] focus:ring-[#4F46E5] sm:text-sm p-3 border font-medium" />
                {errors.stock && <span className="text-red-500 text-xs font-medium mt-1 block">Stock is required</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">Sizes (comma-separated, e.g. S, M, L, XL)</label>
              <input {...register('sizes')} placeholder="Enter sizes" className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-[#4F46E5] focus:ring-[#4F46E5] sm:text-sm p-3 border font-medium" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">Short Description</label>
              <textarea {...register('description')} rows={3} placeholder="Enter short description" className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-[#4F46E5] focus:ring-[#4F46E5] sm:text-sm p-3 border font-medium" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1.5">Status</label>
                <select {...register('status')} className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-[#4F46E5] focus:ring-[#4F46E5] sm:text-sm p-3 border font-medium">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex flex-col justify-center mt-6 gap-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('trending')} className="w-5 h-5 rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]" />
                  <span className="text-sm font-bold text-slate-900">Mark as Trending</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('newArrival')} className="w-5 h-5 rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]" />
                  <span className="text-sm font-bold text-slate-900">Mark as New Arrival</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 pb-8">
            <button type="button" onClick={handleCancel} className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-bold transition-colors shadow-sm">
              Cancel
            </button>
            <button type="submit" disabled={uploading} className="flex-1 py-3.5 bg-[#3b41e3] text-white rounded-xl hover:bg-[#2e34e5] disabled:opacity-70 text-sm font-bold transition-colors shadow-sm">
              {uploading ? 'Saving...' : editingId ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto md:max-w-none">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 pr-4 py-3 border border-slate-100 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] w-full text-sm font-medium"
          />
        </div>
        <button
          onClick={() => {
            reset();
            setEditingId(null);
            setIsAdding(true);
          }}
          className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-[#2e34e5] text-white rounded-xl hover:bg-[#2025a1] shadow-sm"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-6 pb-8">
        {categories.map((cat) => {
          const catProducts = filteredProducts.filter(p => p.category === cat);
          if (catProducts.length === 0 && !searchTerm) return null; // hide empty categories unless searching

          return (
            <div key={cat} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <button
                onClick={() => setExpandedGroups(prev => ({ ...prev, [cat]: !prev[cat] }))}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedGroups[cat] ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                  <h3 className="font-bold text-slate-900">{cat} ({catProducts.length})</h3>
                </div>
              </button>

              {expandedGroups[cat] && (
                <div className="p-4 space-y-3">
                  {catProducts.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 font-medium text-sm">No products found in this category.</div>
                  ) : (
                    catProducts.map((product) => (
                      <div key={product.id} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center gap-4 relative group cursor-pointer hover:border-indigo-100 transition-colors" onClick={() => handleEdit(product)}>
                        <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-lg overflow-hidden">
                          <img className="w-full h-full object-cover" src={product.imageUrl || 'https://via.placeholder.com/64'} alt={product.name} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[14px] font-bold text-slate-900 truncate mb-0.5">{product.name}</h4>
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <span className="font-bold text-[#10b981]">₹{product.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                            <span className="text-slate-400 font-medium">Stock: {product.stock}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-end gap-2">
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${product.status === 'Active' ? 'bg-[#eafff0] text-[#10b981]' : 'bg-slate-100 text-slate-500'
                            }`}>
                            {product.status || 'Active'}
                          </span>

                          <div className="hidden group-hover:flex items-center gap-1 absolute right-3 bottom-2 bg-white/90 backdrop-blur-sm p-1 rounded-md shadow-sm border border-slate-100" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleDelete(product.id)} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
