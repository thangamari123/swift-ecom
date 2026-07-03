import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { useStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ChevronLeft, MoreVertical } from 'lucide-react';
import { toast } from 'react-toastify';

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart, cart, requireAuth } = useStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const cartItemsCount = (cart || []).reduce((total, item) => total + item.quantity, 0);
  void cartItemsCount; // reserved for future use

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!wishlist || wishlist.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        // Fetch storefront config for Flash Sale products that might not be in the products collection
        const storefrontDoc = await getDoc(doc(db, 'storefront', 'homepage'));
        const storefrontData = storefrontDoc.exists() ? storefrontDoc.data() : null;
        const flashSaleProducts = storefrontData?.flashSale?.products || [];

        const productPromises = wishlist.map(async (id) => {
          // Check standard products collection
          const productDoc = await getDoc(doc(db, 'products', id));
          if (productDoc.exists()) {
             return { id: productDoc.id, ...productDoc.data() };
          }
          
          // Fallback to flash sale array
          const flashProd = flashSaleProducts.find((p: any) => p.id === id || p.id === Number(id));
          if (flashProd) {
             return {
                id: flashProd.id,
                name: flashProd.name,
                price: flashProd.salePrice || flashProd.originalPrice || 0,
                imageUrl: flashProd.image || flashProd.imageUrl,
             };
          }
          
          return null; // Product completely missing
        });

        const docs = await Promise.all(productPromises);
        setProducts(docs.filter(p => p !== null));
      } catch (e) {
        console.error("Error fetching wishlist", e);
        toast.error('Failed to load wishlist');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [wishlist]);

  const handleAddToCart = (product: any) => {
    requireAuth(() => {
      addToCart({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.imageUrl || `https://picsum.photos/seed/${product.id}/400/400`,
      });
      toast.success('Added to cart!');
    });
  };

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <div className="hidden md:block">
        <Navbar />
      </div>
      
      <main className="w-full max-w-6xl mx-auto relative min-h-screen">
        {/* Mobile Header */}
        <div className="md:hidden px-4 py-4 flex items-center justify-between sticky top-0 bg-white z-20">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-700">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Wishlist</h1>
          <button className="p-2 -mr-2 text-slate-700">
             <MoreVertical className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="hidden md:block">
           <h1 className="text-3xl font-bold text-slate-900 mb-8 mt-8 px-4 sm:px-6 lg:px-8">My Wishlist</h1>
        </div>

        {loading ? (
          <div className="px-4 py-2 space-y-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 md:space-y-0">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl md:border md:border-slate-100 md:shadow-sm flex md:flex-col items-center relative py-2 border-b border-slate-50 md:border-b-slate-100 animate-pulse">
                <div className="w-[120px] h-[120px] md:w-full md:h-48 bg-slate-100 rounded-xl flex-shrink-0"></div>
                <div className="flex-1 ml-4 md:ml-0 md:p-4 w-full">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2 md:mt-0 mt-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                    <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (!wishlist || wishlist.length === 0) ? (
          <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl mx-4 shadow-sm mt-4">
            <h2 className="text-lg font-medium text-slate-700 mb-4">Your wishlist is empty</h2>
            <Link to="/shop" className="text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 px-6 py-2 rounded-xl">Explore Products</Link>
          </div>
        ) : (
          <div className="px-4 py-2 space-y-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 md:space-y-0">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-2xl md:border md:border-slate-100 md:shadow-sm flex md:flex-col items-center relative py-2 border-b border-slate-50 md:border-b-slate-100">
                <Link to={`/product/${product.id}`} className="shrink-0">
                  <div className="w-24 h-24 md:w-full md:h-auto md:aspect-square bg-[#f8f9fa] rounded-2xl flex items-center justify-center p-3">
                    <img
                      src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/400`}
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-multiply"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </Link>
                <div className="pl-4 pr-10 py-1 flex-1 md:p-4 md:w-full md:pr-4 relative">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="text-sm font-semibold text-slate-900 truncate mb-1">{product.name}</h3>
                  </Link>
                  <div className="font-bold text-[15px] text-slate-900 mb-3">
                    ₹{product.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <button 
                    onClick={() => handleAddToCart(product)} 
                    className="px-4 py-1.5 text-[13px] font-semibold text-[#4F46E5] border border-[#4F46E5]/30 rounded-[10px] hover:bg-[#4F46E5]/5 transition w-fit md:w-full flex items-center justify-center"
                  >
                    Add to Cart
                  </button>

                  <button 
                    onClick={() => requireAuth(() => toggleWishlist(product.id))} 
                    className="absolute right-0 top-1/2 -translate-y-1/2 md:top-auto md:bottom-4 md:right-4 md:translate-y-0 p-2 text-slate-400 hover:text-red-500 rounded-full"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
