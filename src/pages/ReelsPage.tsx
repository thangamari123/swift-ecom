import { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { BottomNav } from '@/components/BottomNav';
import { Heart, ShoppingBag, ArrowLeft, PlaySquare, Star, Volume2, VolumeX } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Link, useNavigate } from 'react-router-dom';
import { getProductUrl } from '@/utils/slug';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  videoUrl?: string;
  category: string;
  description?: string;
  newArrival?: boolean;
  slug?: string;
}

const ReelVideo = ({ src, isMuted }: { src: string; isMuted: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.6, // Play when 60% of the video is in view
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(() => {
            // Ignore autoplay errors
          });
        } else {
          videoRef.current?.pause();
        }
      });
    }, options);

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      loop
      muted={isMuted}
      playsInline
      className="w-full h-full object-cover opacity-90 cursor-pointer"
    />
  );
};

export default function ReelsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isMuted, setIsMuted] = useState(true);
  const { wishlist, toggleWishlist, addToCart, requireAuth } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch products
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      const fetchedProducts = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Product))
        .filter(p => !!p.videoUrl); // Only allow products with videos
      setProducts(fetchedProducts);

      // Extract unique categories
      const uniqueCategories = ['All', ...Array.from(new Set(fetchedProducts.map(p => p.category).filter(Boolean)))];
      setCategories(uniqueCategories);
    });

    return () => unsubscribe();
  }, []);

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="bg-black text-white h-[100dvh] w-full overflow-hidden flex flex-col relative pb-[68px] md:pb-0">

      {/* Top Header & Categories (Absolute so it floats over reels) */}
      <div className="absolute top-0 left-0 right-0 z-50 pt-4 pb-2 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center px-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white/90 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold ml-2 tracking-tight flex items-center gap-2">
            <PlaySquare className="w-5 h-5" /> Reels
          </h1>
        </div>

        {/* Categories Scroll */}
        <div className="flex overflow-x-auto hide-scrollbar px-4 gap-2 pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-none px-4 py-1.5 rounded-full text-[13px] font-semibold border backdrop-blur-md transition-all ${selectedCategory === cat
                ? 'bg-white text-black border-white'
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Full Screen Vertical Scroll Container */}
      <div className="flex-1 overflow-y-auto snap-y snap-mandatory hide-scrollbar">
        {filteredProducts.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white/50">
            No products found in this category.
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="relative h-full w-full snap-start bg-black flex flex-col justify-end">
              {/* Product Background Media */}
              <div className="absolute inset-0 w-full h-full" onClick={() => setIsMuted(!isMuted)}>
                {product.videoUrl && (
                  <ReelVideo src={product.videoUrl} isMuted={isMuted} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
              </div>

              {/* Product Info & Actions Overlay */}
              <div className="relative z-10 flex items-end justify-between p-4 md:p-8 pb-[30px]">

                {/* Left Side: Info */}
                <div className="flex-1 pr-12">
                  <span className="inline-block px-2 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-md mb-3">
                    {product.category}
                  </span>
                  <Link to={getProductUrl(product)}>
                    <h2 className="text-2xl font-bold text-white leading-tight mb-2 hover:underline decoration-white/50">
                      {product.name}
                    </h2>
                  </Link>
                  <p className="text-white/80 text-sm line-clamp-2 mb-3 max-w-[280px]">
                    {product.description || "Premium quality product tailored to elevate your lifestyle. Swipe up for more like this."}
                  </p>
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className="w-3.5 h-3.5 fill-[#fbbf24] text-[#fbbf24]" />
                    ))}
                    <span className="text-xs font-semibold text-white/90 ml-2">4.9</span>
                  </div>
                  <p className="text-3xl font-black text-white mt-2">${product.price.toFixed(2)}</p>
                </div>

                {/* Right Side: Actions (Vertical Stack) */}
                <div className="flex flex-col items-center gap-6 pb-4 z-20 relative">
                  
                  {/* Mute Toggle */}
                  {product.videoUrl && (
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMuted(!isMuted);
                        }}
                        className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-transform active:scale-90"
                      >
                        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                      </button>
                      <span className="text-[10px] font-semibold text-white/90 shadow-sm">
                        {isMuted ? 'Unmute' : 'Mute'}
                      </span>
                    </div>
                  )}
                  {/* Wishlist */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => requireAuth(() => toggleWishlist(product.id))}
                      className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-transform active:scale-90"
                    >
                      <Heart className={`w-6 h-6 ${wishlist.includes(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                    <span className="text-[10px] font-semibold text-white/90 shadow-sm">
                      {wishlist.includes(product.id) ? 'Saved' : 'Save'}
                    </span>
                  </div>

                  {/* Add to Cart */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => requireAuth(() => addToCart({
                        id: product.id,
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: 1,
                        image: product.imageUrl
                      }))}
                      className="w-12 h-12 rounded-full bg-blue-600 border border-blue-500 flex items-center justify-center text-white transition-transform active:scale-90 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                    >
                      <ShoppingBag className="w-6 h-6" />
                    </button>
                    <span className="text-[10px] font-semibold text-white/90 shadow-sm">Cart</span>
                  </div>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
