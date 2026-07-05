import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<{ id: string; name: string; image?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, image: doc.data().image })));
      setLoading(false);
    }, (error) => {
      console.log('Categories listener error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getFallbackImage = (name: string) => {
    const map: Record<string, string> = {
      'Men': 'https://images.unsplash.com/photo-1516826957135-700ede19c111?q=80&w=400&auto=format&fit=crop',
      'Women': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=400&auto=format&fit=crop',
      'Shoes': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop',
      'Bags': 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=400&auto=format&fit=crop',
      'Kids': 'https://images.unsplash.com/photo-1519238382377-50b2b8c9dce8?q=80&w=400&auto=format&fit=crop',
      'Electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=400&auto=format&fit=crop',
      'Accessories': 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?q=80&w=400&auto=format&fit=crop',
    };
    return map[name] || `https://picsum.photos/seed/${name}/400/400`;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-7xl mx-auto md:px-6 md:py-8">
        <div className="bg-white md:rounded-3xl md:shadow-sm md:border md:border-slate-100 p-4 md:p-8">
          <div className="flex items-center mb-6">
            <Link to="/" className="mr-4 p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">All Categories</h1>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="animate-pulse bg-white rounded-2xl border border-slate-100 p-2 shadow-sm">
                  <div className="w-full aspect-square bg-slate-100 rounded-xl mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded w-2/3 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {categories.map((category) => (
                <Link
                  to={`/category/${encodeURIComponent(category.name?.trim() || '')}`}
                  key={category.id}
                  className="group bg-white rounded-2xl border border-slate-100 p-2 shadow-sm hover:shadow-md transition-all flex flex-col items-center"
                >
                  <div className="w-full aspect-square bg-slate-100 rounded-xl overflow-hidden mb-3 relative">
                    <img
                      src={category.image || getFallbackImage(category.name)}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm md:text-base mb-1 text-center truncate w-full px-2">
                    {category.name}
                  </h3>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
      <BottomNav />
    </div>
  );
}
