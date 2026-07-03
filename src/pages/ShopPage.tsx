import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Link, useSearchParams } from "react-router-dom";
import { useStore } from "@/lib/store";
import { toast } from "react-toastify";
import { ShoppingCart, Heart, Filter, Star, Check, ChevronRight, ChevronLeft, Search } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  description: string;
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { wishlist, toggleWishlist, requireAuth } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryFilter = searchParams.get("category");

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [products]);
  const maxPriceFilter = searchParams.get("maxPrice");

  const [sortBy, setSortBy] = useState("Newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const q = query(collection(db, "products"), where("status", "==", "Active"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
      data.sort((a, b) => a.name.localeCompare(b.name));
      setProducts(data);
      setLoading(false);
    }, (error) => {
      console.log("Error fetching products:", error);
      setLoading(false);
      toast.error("Failed to load products");
    });
    return () => unsubscribe();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      if (categoryFilter && product.category?.trim() !== categoryFilter.trim()) return false;
      if (maxPriceFilter && product.price > Number(maxPriceFilter)) return false;
      if (searchParams.get("trending") === "true" && !product.trending) return false;
      if (searchParams.get("newArrival") === "true" && !product.newArrival) return false;
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()) && !(product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
      return true;
    });

    if (sortBy === "Price") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "Popular") {
      // Placeholder for popular sorting
    } else {
      // Newest (assuming data is already from firestore mostly ordered, but we can reverse just to show it works)
    }

    return result;
  }, [products, categoryFilter, maxPriceFilter, sortBy, searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const ProductCard = ({ product }: { product: Product }) => (
    <Link
      to={`/product/${product.id}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-square bg-[#f8f9fa] flex items-center justify-center overflow-hidden p-6">
        <img
          src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/400`}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            requireAuth(() => toggleWishlist(product.id));
          }}
          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md text-slate-400 hover:text-red-500 transition-colors z-10"
        >
          <Heart className={`w-4 h-4 ${wishlist.includes(product.id) ? "fill-red-500 text-red-500" : ""}`} />
        </button>
        <div className="absolute inset-x-0 bottom-[-60px] group-hover:bottom-0 transition-all duration-300 flex items-center justify-center p-3 bg-gradient-to-t from-black/50 to-transparent">
          <button className="bg-white text-slate-900 text-xs font-bold px-4 py-2.5 rounded-full shadow-lg w-full text-center hover:bg-slate-100 transition-colors">
            Quick View
          </button>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-sm font-bold text-slate-900 truncate mb-1">{product.name}</h3>
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-3 h-3 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
          ))}
          <span className="text-[10px] text-slate-400 ml-1">(4.0)</span>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <span className="font-black text-lg text-slate-900">
            ₹{product.price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </span>
          <button onClick={(e) => { 
            e.preventDefault();
            requireAuth(() => toast.success("Added to cart!"));
          }} className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 shadow-md transition-colors">
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      {/* Desktop Navbar */}
      <div className="hidden md:block">
        <Navbar />
      </div>

      <div className="w-full max-w-7xl mx-auto pb-20 md:pb-12">
        {/* Banner */}
        <div className="relative w-full h-32 md:h-48 bg-slate-900 mb-6 md:mb-8 md:rounded-b-3xl overflow-hidden flex items-center justify-center">
          <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <h1 className="relative z-10 text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg">
            {categoryFilter ? `${categoryFilter.trim()}'s Collection` : 'All Products'}
          </h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8 px-4 md:px-6">
          {/* Sidebar */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm sticky top-24">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-lg">
                <Filter className="w-5 h-5" /> Filters
              </h3>
              
              {/* Category */}
              <div className="mb-8">
                <h4 className="text-sm font-bold text-slate-900 mb-4">Category</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 cursor-pointer group" onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete("category");
                    setSearchParams(newParams);
                    setCurrentPage(1);
                  }}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${!categoryFilter ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 group-hover:border-indigo-600'}`}>
                      <Check className={`w-3 h-3 ${!categoryFilter ? 'text-white' : 'text-transparent group-hover:text-indigo-600'} transition-colors`} />
                    </div>
                    <span className={`text-sm font-medium transition-colors ${!categoryFilter ? 'text-slate-900 font-bold' : 'text-slate-600 group-hover:text-slate-900'}`}>All Categories</span>
                  </div>
                  {categories.map(c => (
                    <div key={c} className="flex items-center gap-3 cursor-pointer group" onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set("category", c);
                      setSearchParams(newParams);
                      setCurrentPage(1);
                    }}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${categoryFilter === c ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 group-hover:border-indigo-600'}`}>
                        <Check className={`w-3 h-3 ${categoryFilter === c ? 'text-white' : 'text-transparent group-hover:text-indigo-600'} transition-colors`} />
                      </div>
                      <span className={`text-sm font-medium transition-colors ${categoryFilter === c ? 'text-slate-900 font-bold' : 'text-slate-600 group-hover:text-slate-900'}`}>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Price */}
              <div className="mb-8">
                <h4 className="text-sm font-bold text-slate-900 mb-4">Price</h4>
                <div className="space-y-3">
                  {['Under ₹1000', '₹1000 - ₹2000', '₹2000 - ₹5000', 'Over ₹5000'].map(p => (
                    <label key={p} className="flex items-center gap-3 cursor-pointer group">
                      <div className="w-4 h-4 rounded border border-slate-300 group-hover:border-indigo-600 flex items-center justify-center transition-colors">
                        <Check className="w-3 h-3 text-transparent group-hover:text-indigo-600 transition-colors" />
                      </div>
                      <span className="text-sm text-slate-600 group-hover:text-slate-900 font-medium transition-colors">{p}</span>
                    </label>
                  ))}
                </div>
              </div>



              {/* Size */}
              <div className="mb-8">
                <h4 className="text-sm font-bold text-slate-900 mb-4">Size</h4>
                <div className="flex flex-wrap gap-2">
                  {['S', 'M', 'L', 'XL', 'XXL'].map(s => (
                    <button key={s} className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 hover:border-indigo-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>


            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Top Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 gap-4">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-12 pr-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                <p className="text-sm font-semibold text-slate-600 whitespace-nowrap hidden xl:block">
                  <span className="text-indigo-600">{currentProducts.length}</span> of {filteredProducts.length} items
                </p>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                  <span className="text-sm font-bold text-slate-900 whitespace-nowrap">Sort By</span>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full sm:w-auto"
                  >
                    <option value="Newest">Newest</option>
                    <option value="Price">Price</option>
                    <option value="Popular">Popular</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
                    <div className="aspect-square bg-slate-100" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : currentProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-5xl mb-4">🔍</p>
                <p className="font-bold text-slate-900 text-xl mb-2">No products found</p>
                <p className="text-slate-500 font-medium">Try adjusting your filters or search query.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                  {currentProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 shadow-sm transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-10 h-10 rounded-xl font-bold transition-all shadow-sm ${
                          currentPage === i + 1 
                          ? 'bg-indigo-600 text-white border-transparent' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 shadow-sm transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
      <BottomNav />
    </div>
  );
}
