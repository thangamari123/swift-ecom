import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useStore } from "@/lib/store";
import { toast } from "react-toastify";
import { Heart, Search, Filter, X, Star, ChevronRight } from 'lucide-react';
import { getProductUrl } from '@/utils/slug';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  description: string;
  rating?: number;
  reviews?: number;
  salePrice?: number;
  originalPrice?: number;
  sizes?: string[];
  colors?: string[];
  newArrival?: boolean;
  slug?: string;
}

const getCategoryImage = (name: string) => {
  const map: Record<string, string> = {
    'Men': 'https://images.unsplash.com/photo-1516826957135-700ede19c111?q=80&w=1200&auto=format&fit=crop',
    'Women': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop',
    'Shoes': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop',
    'Bags': 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1200&auto=format&fit=crop',
    'Kids': 'https://images.unsplash.com/photo-1519238382377-50b2b8c9dce8?q=80&w=1200&auto=format&fit=crop',
    'Electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=1200&auto=format&fit=crop',
    'Accessories': 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?q=80&w=1200&auto=format&fit=crop',
    'Watch': 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=1200&auto=format&fit=crop',
    'Home Decorate': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop',
  };
  return map[name] || `https://picsum.photos/seed/${name}/1200/400`;
};

export default function CategoryPage() {
  const { categoryName } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { wishlist, toggleWishlist, requireAuth } = useStore();
  const [sortBy, setSortBy] = useState("Newest");

  const safeCategoryName = decodeURIComponent(categoryName || '').trim();

  useEffect(() => {
    if (!safeCategoryName) return;

    const q = query(collection(db, "products"), where("status", "==", "Active"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
      let targetCat = safeCategoryName.toLowerCase().replace(/s$/, '').trim();
      if (targetCat === 'home') targetCat = 'home decorate';
      
      const filtered = data.filter(p => {
        const productCat = (p.category || '').toLowerCase().replace(/s$/, '').trim();
        return productCat === targetCat;
      });
      setProducts(filtered);
      setLoading(false);
    }, (error) => {
      console.log("Error fetching products:", error);
      setLoading(false);
      toast.error("Failed to load products");
    });
    return () => unsubscribe();
  }, [safeCategoryName]);

  const sortedProducts = useMemo(() => {
    let result = [...products];
    if (sortBy === "Price (Low to High)") {
      result.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
    } else if (sortBy === "Price (High to Low)") {
      result.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
    }
    return result;
  }, [products, sortBy]);

  const bannerImage = getCategoryImage(products[0]?.category || safeCategoryName);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0 flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative w-full h-[250px] md:h-[400px] bg-slate-900 overflow-hidden">
          <img
            src={bannerImage}
            alt={safeCategoryName}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-12 max-w-7xl mx-auto w-full">
            <div className="flex items-center text-white/70 text-xs md:text-sm mb-2 md:mb-4">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-4 h-4 mx-1 md:mx-2" />
              <Link to="/categories" className="hover:text-white transition-colors">Categories</Link>
              <ChevronRight className="w-4 h-4 mx-1 md:mx-2" />
              <span className="text-white font-medium capitalize">{safeCategoryName}</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-serif text-white mb-2 md:mb-4 capitalize tracking-tight">
              {safeCategoryName}
            </h1>
            <p className="text-white/80 max-w-xl text-sm md:text-base font-light">
              Discover our exclusive collection of {safeCategoryName.toLowerCase()}. Thoughtfully curated and designed for the modern lifestyle.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-slate-600 font-medium">
              Showing <span className="text-slate-900 font-bold">{sortedProducts.length}</span> products
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border-none text-slate-700 text-sm rounded-xl px-4 py-2 focus:ring-2 focus:ring-slate-200 outline-none font-medium cursor-pointer"
              >
                <option>Newest</option>
                <option>Price (Low to High)</option>
                <option>Price (High to Low)</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="animate-pulse flex flex-col bg-white rounded-2xl p-4 shadow-sm">
                  <div className="w-full aspect-square bg-slate-100 rounded-xl mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📦</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No products found</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">We couldn't find any products in this category right now. Check back later for exciting new arrivals.</p>
              <Link to="/shop" className="inline-block bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {sortedProducts.map((product) => (
                <Link
                  key={product.id}
                  to={getProductUrl(product)}
                  className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative aspect-square bg-[#f8f9fa] flex items-center justify-center overflow-hidden p-6">
                    <img
                      src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/400`}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        requireAuth(() => toggleWishlist(product.id));
                      }}
                      className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur rounded-full shadow-sm text-slate-400 hover:text-red-500 hover:bg-white transition-all z-10"
                    >
                      <Heart className={`w-4 h-4 ${wishlist.includes(product.id) ? "fill-red-500 text-red-500" : ""}`} />
                    </button>
                    {product.salePrice && product.originalPrice && Number(product.originalPrice) > Number(product.salePrice) && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                        -{Math.round(((Number(product.originalPrice) - Number(product.salePrice)) / Number(product.originalPrice)) * 100)}%
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="flex items-center gap-1 mb-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= Math.round(product.rating || 4.5) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                      ))}
                      <span className="text-[10px] text-slate-400 ml-1">({product.reviews || 0})</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 mb-2 group-hover:text-black transition-colors">{product.name}</h3>
                    <div className="mt-auto flex items-center gap-2">
                      <span className="font-bold text-slate-900">₹{Number(product.salePrice || product.price || 0).toLocaleString()}</span>
                      {product.salePrice && product.originalPrice && Number(product.originalPrice) > Number(product.salePrice) && (
                        <span className="text-xs text-slate-400 line-through">₹{Number(product.originalPrice).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
