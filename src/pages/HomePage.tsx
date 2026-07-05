import { useEffect, useState, useRef, Fragment } from 'react';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';

import { getProductUrl } from '@/utils/slug';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { useStore } from '@/lib/store';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  newArrival?: boolean;
  trending?: boolean;
  slug?: string;
}

const CategoryIcon = ({ cat, i }: { cat: any, i: number }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const imgArray = [cat.image, cat.img, cat.image2, cat.image3, cat.image4, cat.image5, cat.image6].filter(Boolean);
  if (cat.additionalImages) {
    imgArray.push(...cat.additionalImages.split(',').map((u: string) => u.trim()).filter(Boolean));
  }

  useEffect(() => {
    if (imgArray.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % imgArray.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [imgArray.length]);

  return (
    <Link
      to={`/category/${encodeURIComponent(cat.name?.trim() || '')}`}
      className="group flex flex-col items-center flex-1 transition-all duration-300 min-w-[60px]"
    >
      <div className={`relative w-full max-w-[90px] md:max-w-[180px] aspect-square rounded-2xl overflow-hidden shadow-sm md:group-hover:shadow-md md:hover:-translate-y-1 transition-all duration-300 ${['bg-[#f2f7f2]', 'bg-[#fff0ef]', 'bg-[#fff8e7]', 'bg-[#f6f7f2]', 'bg-[#fff0f5]'][i % 5]}`}>
        {/* Images or Fallback */}
        <div className="absolute inset-0 w-full h-full pb-5 md:pb-8 pt-2">
          <div className="relative w-full h-full flex items-center justify-center">
            {imgArray.length > 0 ? (
              imgArray.map((imgUrl, imgIdx) => (
                <img
                  key={imgIdx}
                  src={imgUrl}
                  alt={cat.label}
                  className={`absolute inset-0 w-full h-full object-contain md:group-hover:scale-110 transition-all duration-700 ease-out ${imgIdx === currentIdx ? 'opacity-100 scale-100 translate-y-0 z-10' : 'opacity-0 scale-75 translate-y-4 z-0'}`}
                />
              ))
            ) : (
              <span className="text-2xl md:text-5xl font-black text-slate-800 opacity-20 uppercase">
                {cat.label?.[0] || '?'}
              </span>
            )}
          </div>
        </div>

        {/* Name inside card */}
        <div className="absolute bottom-0 left-0 right-0 p-1.5 md:p-2 bg-white/40 backdrop-blur-sm">
          <span className="block text-[10px] md:text-base font-bold text-slate-900 text-center leading-tight truncate">{cat.label}</span>
        </div>
      </div>
    </Link>
  );
};

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [storefront, setStorefront] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingStorefront, setLoadingStorefront] = useState(true);
  const { wishlist, toggleWishlist, requireAuth } = useStore();
  const [flashCountdown, setFlashCountdown] = useState({ h: '00', m: '00', s: '00', expired: false });
  const [showPopup, setShowPopup] = useState(false);

  const slides = storefront?.heroSlides || [];

  const getSectionEnabled = (sectionKey: string) =>
    storefront?.sectionConfig?.[sectionKey]?.enabled ?? true;

  const newArrivalsScrollRef = useRef<HTMLDivElement>(null);

  // Auto-advance hero slider
  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);



  // Flash Sale countdown timer
  useEffect(() => {
    if (!storefront?.flashSale?.endDate) return;
    const tick = () => {
      const diff = new Date(storefront.flashSale.endDate).getTime() - Date.now();
      if (diff <= 0) {
        setFlashCountdown({ h: '00', m: '00', s: '00', expired: true });
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setFlashCountdown({
        h: String(h).padStart(2, '0'),
        m: String(m).padStart(2, '0'),
        s: String(s).padStart(2, '0'),
        expired: false
      });
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [storefront?.flashSale?.endDate]);

  // Auto-scroll logic removed for Flash Sale and Trending Now to allow pure native manual swiping


  // Firestore listeners
  useEffect(() => {
    const q = query(
      collection(db, 'products'),
      where('status', '==', 'Active'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeProducts = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setFeaturedProducts(data);
      setLoadingProducts(false);
    }, () => {
      // Fallback without orderBy if index doesn't exist
      const q2 = query(collection(db, 'products'), where('status', '==', 'Active'));
      onSnapshot(q2, (snap) => {
        setFeaturedProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
        setLoadingProducts(false);
      });
    });

    const unsubscribeStorefront = onSnapshot(doc(db, 'storefront', 'homepage'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStorefront(data);
        // Check if popup should be shown
        if (data.homePopup?.enabled && data.homePopup?.image) {
          setShowPopup(true);
        }
      }
      setLoadingStorefront(false);
    }, (error) => {
      console.log('Storefront listener error:', error);
      setLoadingStorefront(false);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeStorefront();
    };
  }, []);

  return (
    <div className="flex-1 bg-[#FAFAFA] flex flex-col min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-80px)]">
      <Navbar />

      {/* HOME POPUP MODAL */}
      {showPopup && storefront?.homePopup?.enabled && storefront?.homePopup?.image && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative max-w-lg w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-3 right-3 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
              aria-label="Close popup"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
            <Link to={storefront.homePopup.link || "/shop"} onClick={() => setShowPopup(false)} className="block relative group">
              <img src={storefront.homePopup.image} alt="Promotion" className="w-full h-auto object-cover max-h-[70vh]" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
            </Link>
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto md:px-6 lg:px-8 pb-20 md:pb-8 flex flex-col space-y-6 md:space-y-12 bg-white min-h-screen relative shadow-sm">
        {(loadingStorefront || loadingProducts) ? (
          <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* ─── HERO SLIDER ─── */}
            {getSectionEnabled('heroSlider') && slides.length > 0 && (
              <section className="px-4 pt-2 md:px-8 md:pt-4 pb-2 md:pb-4">
                <div className="relative w-full aspect-[1931/814] group">
                  {/* Inner Banner Container (Clips images) */}
                  <div className="absolute inset-0 overflow-hidden rounded-2xl md:rounded-3xl shadow-md">
                    {/* Slides track */}
                    <div
                      className="flex h-full transition-transform duration-500 ease-in-out"
                      style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    >
                      {slides.map((slide: any, idx: number) => (
                        <Link to={slide.link || "/shop"} key={idx} className="w-full flex-shrink-0 flex h-full relative group block">
                          {/* Background Image */}
                          <img src={slide.image} alt={slide.title} className="absolute inset-0 w-full h-full object-cover" />

                          {/* Content (Left aligned) */}
                          <div className="relative z-10 w-full md:w-3/5 h-full flex flex-col justify-center px-6 md:px-12 py-8">
                            {slide.decorations && (
                              <>
                                <div className="absolute top-[-12px] right-[-12px] w-20 h-20 opacity-20 pointer-events-none">
                                  <svg viewBox="0 0 100 100" className="fill-white">
                                    <path d="M50 0 C70 20, 100 50, 50 100 C30 80, 0 50, 50 0" />
                                  </svg>
                                </div>
                              </>
                            )}

                            {(() => {
                              const logosList = (typeof slide.logos === 'string' ? slide.logos.split(',') : slide.logos || []).filter((l: string) => l.trim() !== '');
                              return logosList.length > 0 ? (
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {logosList.map((logo: string, i: number) => (
                                    <span key={i} className="bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-[10px] md:text-[11px] font-black text-white uppercase tracking-wider shadow-sm">
                                      {logo.trim()}
                                    </span>
                                  ))}
                                </div>
                              ) : null;
                            })()}
                            <p className="text-[13px] md:text-base text-white/90 font-semibold mb-1 md:mb-2">{slide.title}</p>
                            <h1 className="text-[26px] md:text-5xl font-black text-white tracking-tight leading-none drop-shadow-lg">{slide.discount}</h1>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Navigation Arrows (Straddling the edges) */}
                  <button
                    onClick={(e) => { e.preventDefault(); setCurrentSlide(prev => (prev === 0 ? slides.length - 1 : prev - 1)); }}
                    className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full items-center justify-center shadow-md z-10 text-slate-700 hover:text-slate-900 hover:bg-gray-50 transition-colors"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); setCurrentSlide(prev => (prev === slides.length - 1 ? 0 : prev + 1)); }}
                    className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-10 h-10 bg-white rounded-full items-center justify-center shadow-md z-10 text-slate-700 hover:text-slate-900 hover:bg-gray-50 transition-colors"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
                  </button>

                  {/* Dot indicators (Straddling the bottom edge) */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex gap-1.5 z-20 bg-white px-2.5 py-1 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-slate-100">
                    {slides.map((_: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={(e) => { e.preventDefault(); setCurrentSlide(idx); }}
                        className={`h-2 w-2 rounded-full transition-all duration-300 ${currentSlide === idx ? 'bg-[#ff6b00]' : 'bg-gray-300 hover:bg-gray-400'}`}
                        aria-label={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ─── SHOP BY CATEGORY ─── */}
            {getSectionEnabled('shopByCategory') && (
              <section className="px-4 md:px-6 py-3 md:py-5 w-full max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6 w-full">
                  <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">{storefront?.sectionConfig?.shopByCategory?.title || 'Categories'}</h2>
                  <Link to="/categories" className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors shrink-0">
                    See All
                  </Link>
                </div>

                {(() => {
                  const categoriesList = storefront?.shopByCategory || [
                    { name: 'Men', image: 'https://images.unsplash.com/photo-1516826957135-700ede19c111?w=600', label: 'Men' },
                    { name: 'Women', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600', label: 'Women' },
                    { name: 'Kid', image: 'https://images.unsplash.com/photo-1519238382377-50b2b8c9dce8?w=600', label: 'Kids' },
                    { name: 'Home Decorate', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600', label: 'Home' },
                    { name: 'Watch', image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600', label: 'Watches' }
                  ];
                  return (
                    <div className="flex justify-between items-start gap-2 md:gap-6 w-full max-w-6xl mx-auto">
                      {categoriesList.slice(0, 5).map((cat: any, i: number) => (
                        <CategoryIcon key={i} cat={cat} i={i} />
                      ))}
                    </div>
                  );
                })()}
              </section>
            )}

            {/* ─── HELPER COMPONENT FOR PRODUCT GRIDS ─── */}
            {(() => {
              const ProductSection = ({ title, products, link, linkText, scrollRef }: any) => {
                if (products.length === 0) return null;
                return (
                  <section className="px-4 md:px-6 py-3 md:py-5 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-5">
                      <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
                      <Link to={link} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 px-3 py-1.5 rounded-full transition-all">
                        {linkText} <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <div
                      ref={scrollRef}
                      className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5 pb-4"
                    >
                      {products.map((product: any, idx: number) => {
                        let badge = null;
                        if (idx % 3 === 0) badge = <span className="absolute top-2.5 left-2.5 bg-[#0f172a] text-white text-[9px] md:text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm z-10">New</span>;
                        else if (idx % 3 === 1) badge = <span className="absolute top-2.5 left-2.5 bg-[#e11d48] text-white text-[9px] md:text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm z-10">Sale</span>;
                        else badge = <span className="absolute top-2.5 left-2.5 bg-[#d97706] text-white text-[9px] md:text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm z-10">Bestseller</span>;

                        const reviewCount = 80 + (idx * 23) + (product.name.length * 7);

                        return (
                          <Link
                            to={getProductUrl(product)}
                            key={product.id}
                            className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] border border-slate-100 md:hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] transition-all duration-300 md:hover:-translate-y-1"
                          >
                            <div className="relative aspect-[4/5] w-full bg-slate-100 overflow-hidden flex items-center justify-center">
                              {badge}
                              <button
                                className={`absolute top-2 right-2 md:top-3 md:right-3 w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:text-rose-500 hover:bg-white transition-colors z-10 ${wishlist.includes(product.id) ? 'text-rose-500' : 'text-slate-400'}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  requireAuth(() => toggleWishlist(product.id));
                                }}
                              >
                                <Heart className={`w-4 h-4 md:w-5 md:h-5 ${wishlist.includes(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                              </button>
                              <img
                                src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/500`}
                                alt={product.name}
                                className="w-full h-full object-cover md:group-hover:scale-105 transition-transform duration-700"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="p-3 md:p-4">
                              <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 md:mb-1.5">{product.category}</p>
                              <h3 className="text-xs md:text-sm font-bold text-slate-900 truncate mb-1.5 md:mb-2">{product.name}</h3>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star key={star} className={`w-2.5 h-2.5 md:w-3 md:h-3 ${star <= 4 ? 'fill-[#fbbf24] text-[#fbbf24]' : 'fill-[#fef08a] text-[#fef08a]'}`} />
                                ))}
                                <span className="text-[10px] md:text-xs text-slate-500 font-medium ml-1.5">({reviewCount})</span>
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </section>
                );
              };

              return (
                <>
                  {/* ─── TRENDING NOW (Custom Design) ─── */}
                  {(() => {
                    const trendingProducts = (featuredProducts.filter(p => p.trending).length > 0 ? featuredProducts.filter(p => p.trending) : featuredProducts).slice(0, 6);
                    if (trendingProducts.length === 0) return null;
                    const badges = ['🔥 Hot', '⚡ Fast', '💎 Top', '🌟 Pick', '🎯 Deal', '✨ New'];
                    return (
                      <section className="border-t border-slate-100 py-3 md:py-5">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-5 md:mb-7 px-4 md:px-6">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">🔥</span>
                            <div>
                              <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight leading-none">Trending Now</h2>
                              <p className="text-[10px] md:text-xs text-slate-400 font-medium mt-0.5 hidden md:block">Most loved picks this week</p>
                            </div>
                          </div>
                          <Link to="/shop?trending=true" className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 px-3 py-1.5 rounded-full transition-all">
                            View All <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>

                        {/* ── Marquee Loop (Mobile & Desktop) ── */}
                        <div className="overflow-hidden pb-4 w-[100vw] md:w-full -mx-4 md:mx-0">
                          <div className="flex gap-3 md:gap-6 w-max animate-marquee hover:[animation-play-state:paused] px-4 md:px-0">
                            {[...trendingProducts, ...trendingProducts].map((product: any, idx: number) => (
                              <Link
                                key={`${product.id}-${idx}`}
                                to={getProductUrl(product)}
                                className="group flex-none w-[38vw] md:w-64 rounded-2xl overflow-hidden bg-white shadow-[0_4px_20px_-6px_rgba(0,0,0,0.1)] border border-slate-100 relative hover:-translate-y-1 transition-all duration-300"
                              >
                                {/* Tall image */}
                                <div className="relative aspect-[3/4] w-full bg-slate-100 overflow-hidden">
                                  <img
                                    src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/500`}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    referrerPolicy="no-referrer"
                                  />
                                  {/* Gradient bottom */}
                                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
                                  {/* Badge top-left */}
                                  <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-slate-800 text-[8px] md:text-[9px] font-black px-1.5 md:px-2 py-0.5 md:py-1 rounded-full shadow-sm">
                                    {badges[idx % badges.length]}
                                  </span>
                                  {/* Wishlist */}
                                  <button
                                    className={`absolute top-2 right-2 md:top-3 md:right-3 w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm z-10 ${wishlist.includes(product.id) ? 'text-rose-500' : 'text-slate-400'}`}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); requireAuth(() => toggleWishlist(product.id)); }}
                                  >
                                    <Heart className={`w-4 h-4 md:w-5 md:h-5 ${wishlist.includes(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                                  </button>
                                  {/* Price overlay on image */}
                                  <div className="absolute bottom-2 left-2 right-2 md:bottom-2.5 md:left-3 md:right-3 flex justify-between items-end">
                                    <p className="text-white font-black text-sm md:text-lg leading-none drop-shadow-lg">
                                      ₹{product.price?.toLocaleString?.() ?? product.price}
                                    </p>
                                  </div>
                                </div>
                                {/* Info */}
                                <div className="p-2 md:p-4">
                                  <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5 md:mb-1">{product.category}</p>
                                  <p className="text-[11px] md:text-sm font-bold text-slate-900 truncate">{product.name}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </section>
                    );
                  })()}

                  {/* ─── FLASH SALE ─── */}
                  {storefront?.flashSale?.enabled && !flashCountdown.expired && (storefront.flashSale.products || []).length > 0 && (
                    <section className="px-4 md:px-6 py-3 md:py-5 border-t border-slate-100">
                      <div className="flex flex-col md:flex-row md:items-stretch gap-3 md:gap-0 bg-white/70 backdrop-blur-3xl rounded-xl md:rounded-3xl overflow-hidden p-3 md:p-0 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/80 relative">
                        {/* Luxury Background Glow */}
                        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2" />

                        {/* ── LEFT PANEL (Luxury Premium) ── */}
                        <div className="md:w-64 lg:w-80 flex-shrink-0 p-4 md:p-10 flex flex-col justify-center relative z-10 border-b md:border-b-0 md:border-r border-slate-200/50">

                          {/* Header & Countdown */}
                          <div className="flex justify-between items-center md:flex-col md:items-start mb-4 md:mb-0">

                            <div className="flex flex-col items-start">
                              <span className="inline-block text-[8px] md:text-[10px] font-semibold text-amber-700 uppercase tracking-[0.3em] bg-amber-50 px-2.5 py-1 md:px-3 md:py-1.5 rounded-sm w-max mb-3 md:mb-5 border border-amber-200 shadow-sm">
                                Exclusive Offer
                              </span>
                              <h2 className="text-2xl md:text-4xl font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-800 leading-tight mb-1 md:mb-3 tracking-wide">
                                {storefront.flashSale.title || 'Flash Sale'}
                              </h2>
                              <p className="hidden md:block text-sm text-slate-600 font-serif italic mb-8 leading-relaxed max-w-[220px]">
                                {storefront.flashSale.subtitle || "Curated premium selections. Available for a limited time."}
                              </p>
                            </div>

                            {/* Minimalist Countdown */}
                            <div className="flex items-center gap-2 md:gap-4 md:mb-10">
                              {[{ label: 'Hours', val: flashCountdown.h }, { label: 'Minutes', val: flashCountdown.m }, { label: 'Seconds', val: flashCountdown.s }].map((unit, i) => (
                                <Fragment key={i}>
                                  <div className="flex flex-col items-center">
                                    <div className="w-10 h-10 md:w-16 md:h-16 bg-white/60 backdrop-blur-md rounded-md flex items-center justify-center border border-amber-200 shadow-sm">
                                      <span className="text-lg md:text-4xl font-serif italic text-amber-700 tabular-nums tracking-wider">{unit.val}</span>
                                    </div>
                                    <span className="text-[7px] md:text-[9px] text-slate-500 font-medium mt-2 uppercase tracking-widest">{unit.label}</span>
                                  </div>
                                  {i < 2 && <span className="text-slate-300 text-xl font-serif mb-4 md:mb-6">:</span>}
                                </Fragment>
                              ))}
                            </div>
                          </div>

                          <Link
                            to={storefront.flashSale.link || '/shop'}
                            className="relative z-10 flex items-center justify-center gap-3 bg-white/80 border border-amber-300 text-amber-700 hover:bg-amber-500 hover:text-white hover:border-amber-500 text-[10px] md:text-[12px] font-semibold px-4 py-3 md:px-6 md:py-4 rounded-sm w-full md:w-max transition-all duration-300 uppercase tracking-widest shadow-sm"
                          >
                            Explore Collection <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>

                        {/* ── RIGHT PANEL: Product cards (Slider) ── */}
                        <div className="flex-1 min-w-0 md:bg-slate-50/50 md:p-6 lg:p-10 flex items-center relative group z-10 overflow-hidden">
                          <div
                            className="flex gap-4 md:gap-6 w-max animate-marquee hover:[animation-play-state:paused] pb-4 md:pb-0"
                          >
                            {[...(storefront.flashSale.products || []), ...(storefront.flashSale.products || [])].map((item: any, idx: number) => (
                              <Link
                                key={`${item.id || 'flash'}-${idx}`}
                                to={storefront.flashSale.link || '/shop'}
                                className="group flex-none w-[45vw] md:w-60 lg:w-64 bg-white/60 backdrop-blur-md rounded-sm overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 relative border border-white/80 hover:border-amber-300/50"
                              >
                                {/* Image */}
                                <div className="relative aspect-[4/5] w-full bg-slate-100 overflow-hidden">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover md:group-hover:scale-105 group-hover:opacity-90 transition-all duration-700 ease-in-out"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent opacity-80" />

                                  {/* Wishlist Button */}
                                  <button
                                    className={`absolute top-2 right-2 md:top-3 md:right-3 w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm z-10 ${wishlist.includes(item.id) ? 'text-rose-500' : 'text-slate-400'}`}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); requireAuth(() => toggleWishlist(item.id)); }}
                                  >
                                    <Heart className={`w-4 h-4 md:w-5 md:h-5 ${wishlist.includes(item.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                                  </button>

                                  {item.discount > 0 && (
                                    <span className="absolute top-3 left-3 bg-amber-500 text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-sm tracking-wider">
                                      -{item.discount}%
                                    </span>
                                  )}
                                </div>
                                {/* Info */}
                                <div className="p-4 md:p-5 relative z-10 -mt-2">
                                  <p className="text-xs md:text-sm font-semibold text-slate-800 truncate mb-2 tracking-wide group-hover:text-amber-700 transition-colors">{item.name}</p>
                                  <div className="flex flex-wrap items-baseline gap-2 mb-3">
                                    <span className="text-sm md:text-lg font-bold text-amber-700">₹{item.salePrice?.toLocaleString?.() ?? item.salePrice}</span>
                                    {item.originalPrice > 0 && (
                                      <span className="text-[10px] md:text-xs text-slate-400 line-through font-medium">₹{item.originalPrice?.toLocaleString?.() ?? item.originalPrice}</span>
                                    )}
                                  </div>
                                  {/* Stars */}
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map(s => (
                                      <Star key={s} className={`w-2.5 h-2.5 md:w-3 md:h-3 ${s <= Math.round(item.rating || 4.5) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                                    ))}
                                    <span className="text-[9px] md:text-[10px] text-slate-500 font-medium ml-1">({item.reviews || 0})</span>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ─── SPECIAL OFFER BANNER ─── */}
                  <section className="px-4 md:px-6 pb-3 md:pb-5">
                    <Link to="/shop">
                      <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden bg-[#f4f2ef] shadow-sm hover:shadow-md transition-shadow group flex items-center min-h-[180px] sm:min-h-[220px] md:h-64">
                        {/* Background Image Container */}
                        <div className="absolute inset-0 w-full h-full md:left-1/4 md:w-3/4 flex justify-end">
                          {/* Gradient mask */}
                          <div className="absolute inset-0 bg-gradient-to-r from-[#f4f2ef] via-[#f4f2ef]/90 to-transparent z-10 w-4/5 md:w-1/2"></div>
                          <img
                            src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1200&auto=format&fit=crop"
                            className="w-[85%] md:w-full h-full object-cover object-[70%_top] md:object-top opacity-90 transition-opacity duration-300"
                            alt="Special Offer"
                          />
                        </div>

                        {/* Text Content */}
                        <div className="relative z-20 flex flex-col justify-center h-full p-5 sm:p-8 md:p-12 w-[70%] sm:w-[60%] md:w-1/2">
                          <p className="text-red-500 font-bold text-[9px] sm:text-[10px] md:text-xs tracking-[0.2em] uppercase mb-1.5 md:mb-3">SALE</p>
                          <h2 className="text-[18px] sm:text-2xl md:text-3xl font-black text-slate-900 leading-[1.1] mb-1.5 md:mb-3 tracking-tight">Special Offer</h2>
                          <p className="text-[11px] sm:text-xs md:text-sm text-slate-600 font-medium mb-4 md:mb-6 leading-snug">
                            Limited Time Only.<br />Don't Miss Out!
                          </p>

                          <div className="inline-flex items-center justify-center gap-1.5 md:gap-2 bg-[#111] hover:bg-black text-white px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl text-[11px] md:text-sm font-bold w-max shadow-sm transition-colors">
                            Shop Now <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </section>


                  <ProductSection
                    title="✨ New Arrivals"
                    products={(featuredProducts.filter(p => p.newArrival).length > 0 ? featuredProducts.filter(p => p.newArrival) : featuredProducts).slice(0, 6)}
                    link="/shop?newArrival=true"
                    linkText="View All →"
                    scrollRef={newArrivalsScrollRef}
                  />

                  <ProductSection title="👔 Men's Collection" products={featuredProducts.filter(p => p.category === 'Men').slice(0, 6)} link="/category/Men" linkText="View All →" />
                  <ProductSection title="👗 Women's Collection" products={featuredProducts.filter(p => p.category === 'Women').slice(0, 6)} link="/category/Women" linkText="View All →" />
                  <ProductSection title="🧸 Kids Collection" products={featuredProducts.filter(p => p.category === 'Kid').slice(0, 6)} link="/category/Kid" linkText="View All →" />
                  <ProductSection title="🏠 Home Collection" products={featuredProducts.filter(p => p.category === 'Home Decorate').slice(0, 6)} link="/category/Home%20Decorate" linkText="View All →" />
                  <ProductSection title="⌚ Watch Collection" products={featuredProducts.filter(p => p.category === 'Watch').slice(0, 6)} link="/category/Watch" linkText="View All →" />

                  {/* ─── CUSTOM OFFER BANNERS ─── */}
                  {(storefront?.customBanners || []).filter((b: any) => b.enabled).map((banner: any) => (
                    <section key={banner.id} className="px-4 md:px-6 pb-6 md:pb-8 pt-4 border-t border-slate-100">
                      <Link to={banner.link || '/shop'}>
                        <div
                          style={{ backgroundColor: banner.bgColor || '#f4f2ef' }}
                          className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex items-center min-h-[180px] sm:min-h-[220px] md:h-64"
                        >
                          <div className="absolute inset-0 w-full h-full md:left-1/4 md:w-3/4 flex justify-end">
                            <div
                              style={{ backgroundImage: `linear-gradient(to right, ${banner.bgColor || '#f4f2ef'}, ${banner.bgColor || '#f4f2ef'}E6, transparent)` }}
                              className="absolute inset-0 z-10 w-4/5 md:w-1/2"
                            />
                            <img
                              src={banner.image || 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1200&auto=format&fit=crop'}
                              className="w-[85%] md:w-full h-full object-cover object-[70%_top] md:object-top opacity-90 group-hover:scale-105 transition-transform duration-700"
                              alt={banner.title || 'Offer'}
                            />
                          </div>
                          <div className="relative z-20 flex flex-col justify-center h-full p-5 sm:p-8 md:p-12 w-[70%] sm:w-[60%] md:w-1/2">
                            {banner.badge && (
                              <p style={{ color: banner.textColor || '#000000' }} className="font-bold text-[9px] sm:text-[10px] md:text-xs tracking-[0.2em] uppercase mb-1.5 md:mb-3 opacity-80">
                                {banner.badge}
                              </p>
                            )}
                            <h2 style={{ color: banner.textColor || '#000000' }} className="text-[18px] sm:text-2xl md:text-3xl font-black leading-[1.1] mb-1 md:mb-2 tracking-tight">
                              {banner.title}
                            </h2>
                            {banner.subtitle && (
                              <p style={{ color: banner.textColor || '#000000' }} className="text-[11px] sm:text-xs md:text-sm font-medium mb-3 md:mb-5 opacity-70 leading-snug">
                                {banner.subtitle}
                              </p>
                            )}
                            <div className="inline-flex items-center justify-center gap-1.5 md:gap-2 bg-[#111] hover:bg-black text-white px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl text-[11px] md:text-sm font-bold w-max shadow-sm transition-colors">
                              Shop Now <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </section>
                  ))}
                </>
              );
            })()}


          </>
        )}

      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
