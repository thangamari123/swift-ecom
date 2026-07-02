import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, ShieldCheck, RefreshCcw, HeadphonesIcon, Heart, Star } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { useStore } from '@/lib/store';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  stock?: number;
  trending?: boolean;
  newArrival?: boolean;
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [storefront, setStorefront] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { wishlist, toggleWishlist, requireAuth } = useStore();

  const slides = storefront?.heroSlides || [];

  const getSectionEnabled = (sectionKey: string) =>
    storefront?.sectionConfig?.[sectionKey]?.enabled ?? true;

  // Auto-advance hero slider
  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

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
    }, () => {
      // Fallback without orderBy if index doesn't exist
      const q2 = query(collection(db, 'products'), where('status', '==', 'Active'));
      onSnapshot(q2, (snap) => {
        setFeaturedProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      });
    });

    const unsubscribeStorefront = onSnapshot(doc(db, 'storefront', 'homepage'), (docSnap) => {
      if (docSnap.exists()) setStorefront(docSnap.data());
    }, (error) => console.log('Storefront listener error:', error));

    return () => {
      unsubscribeProducts();
      unsubscribeStorefront();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F7FB] pb-24 md:pb-0">
      <Navbar />

      <main className="w-full max-w-7xl mx-auto bg-white min-h-screen relative shadow-sm">

        {/* ─── HERO SLIDER ─── */}
        {getSectionEnabled('heroSlider') && slides.length > 0 && (
          <section className="px-3 pt-3 md:px-6 md:pt-6">
            <div className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl shadow-md" style={{ height: 'clamp(180px, 42vw, 340px)' }}>
              {/* Slides track */}
              <div
                className="flex h-full transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {slides.map((slide: any, idx: number) => (
                  <Link to={slide.link || "/shop"} key={idx} className="w-full flex-shrink-0 flex h-full relative group block">
                    {/* Background Image */}
                    <img src={slide.image} alt={slide.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

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

              {/* Dot indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {slides.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'}`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── SHOP BY CATEGORY ─── */}
        {getSectionEnabled('shopByCategory') && (
          <section className="px-4 md:px-6 py-6 md:py-10 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">{storefront?.sectionConfig?.shopByCategory?.title || 'Shop by Category'}</h2>
              <Link to="/categories" className="flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-5">
              {(storefront?.shopByCategory || [
                { name: 'Men', image: 'https://images.unsplash.com/photo-1516826957135-700ede19c111?w=600', label: 'Men' },
                { name: 'Women', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600', label: 'Women' },
                { name: 'Kid', image: 'https://images.unsplash.com/photo-1519238382377-50b2b8c9dce8?w=600', label: 'Kids' },
                { name: 'Home Decorate', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600', label: 'Home' },
                { name: 'Watch', image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600', label: 'Watches' }
              ]).map((cat: any, i: number) => (
                <Link
                  key={i}
                  to={`/shop?category=${encodeURIComponent(cat.name)}`}
                  className="group relative rounded-2xl md:rounded-3xl overflow-hidden aspect-[4/5] md:aspect-square block shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  {/* Background Image */}
                  <img
                    src={cat.image || cat.img}
                    alt={cat.label}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* Content Container */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 flex justify-between items-end">
                    {/* Left text */}
                    <div>
                      <h3 className="text-white font-bold text-base md:text-2xl leading-tight md:mb-1.5">{cat.label}</h3>
                      <span className="hidden md:block text-white/90 text-sm font-medium tracking-wide">Shop Now</span>
                    </div>

                    {/* Right arrow (Hidden on mobile as per design) */}
                    <div className="hidden md:flex w-10 h-10 rounded-full border border-white/50 items-center justify-center text-white backdrop-blur-sm group-hover:bg-white group-hover:text-slate-900 transition-all duration-300 shadow-sm">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ─── HELPER COMPONENT FOR PRODUCT GRIDS ─── */}
        {(() => {
          const ProductSection = ({ title, products, link, linkText }: any) => {
            if (products.length === 0) return null;
            return (
              <section className="px-4 md:px-6 py-5 md:py-8 border-t border-slate-100">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg md:text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
                  <Link to={link} className="flex items-center gap-1 text-xs md:text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors">
                    {linkText} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
                  {products.map((product: any, idx: number) => {
                    let badge = null;
                    if (idx % 3 === 0) badge = <span className="absolute top-2.5 left-2.5 bg-[#0f172a] text-white text-[9px] md:text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm z-10">New</span>;
                    else if (idx % 3 === 1) badge = <span className="absolute top-2.5 left-2.5 bg-[#e11d48] text-white text-[9px] md:text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm z-10">Sale</span>;
                    else badge = <span className="absolute top-2.5 left-2.5 bg-[#d97706] text-white text-[9px] md:text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm z-10">Bestseller</span>;

                    const reviewCount = 80 + (idx * 23) + (product.name.length * 7);

                    return (
                      <Link
                        to={`/product/${product.id}`}
                        key={product.id}
                        className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] border border-slate-100 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1"
                      >
                        <div className="relative aspect-[4/5] w-full bg-slate-100 overflow-hidden flex items-center justify-center">
                          {badge}
                          <button
                            className={`absolute top-2.5 right-2.5 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:text-rose-500 hover:bg-white transition-colors z-10 ${wishlist.includes(product.id) ? 'text-rose-500' : 'text-slate-400'}`}
                            onClick={(e) => {
                              e.preventDefault();
                              requireAuth(() => toggleWishlist(product.id));
                            }}
                          >
                            <Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 ${wishlist.includes(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                          </button>
                          <img
                            src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/500`}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
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
              <ProductSection
                title="Trending Now"
                products={(featuredProducts.filter(p => p.trending).length > 0 ? featuredProducts.filter(p => p.trending) : featuredProducts).slice(0, 6)}
                link="/shop"
                linkText="View All →"
              />

              {/* ─── SPECIAL OFFER BANNER ─── */}
              <section className="px-4 md:px-6 pb-6 md:pb-8">
                <Link to="/shop">
                  <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden bg-[#f4f2ef] shadow-sm hover:shadow-md transition-shadow group flex items-center min-h-[220px] md:h-64">
                    {/* Background Image Container */}
                    <div className="absolute inset-0 w-full h-full md:left-1/4 md:w-3/4 flex justify-end">
                      {/* Gradient mask to blend the image seamlessly into the left background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#f4f2ef] via-[#f4f2ef]/80 to-transparent z-10 w-2/3 md:w-1/2"></div>
                      <img
                        src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1200&auto=format&fit=crop"
                        className="w-3/4 md:w-full h-full object-cover object-top opacity-90 group-hover:scale-105 transition-transform duration-700"
                        alt="Summer Sale"
                      />
                    </div>

                    {/* Text Content */}
                    <div className="relative z-20 flex flex-col justify-center h-full p-6 md:p-12 w-full md:w-1/2 max-w-[320px] md:max-w-none">
                      <p className="text-red-500 font-bold text-[10px] md:text-xs tracking-[0.2em] uppercase mb-2 md:mb-3">Summer Sale</p>
                      <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-2 md:mb-3 tracking-tight">UP TO 60% OFF</h2>
                      <p className="text-xs md:text-sm text-slate-600 font-medium mb-5 md:mb-6">
                        Limited Time Offer. <br className="md:hidden" />Don't Miss Out!
                      </p>

                      <div className="inline-flex items-center justify-center gap-2 bg-[#111] hover:bg-black text-white px-5 py-2.5 md:px-6 md:py-3 rounded-xl text-xs md:text-sm font-bold w-max shadow-sm transition-colors">
                        Shop Now <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </section>

              <ProductSection
                title="✨ New Arrivals"
                products={(featuredProducts.filter(p => p.newArrival).length > 0 ? featuredProducts.filter(p => p.newArrival) : featuredProducts).slice(0, 6)}
                link="/shop"
                linkText="View All →"
              />

              <ProductSection title="👔 Men's Collection" products={featuredProducts.filter(p => p.category === 'Men').slice(0, 6)} link="/shop?category=Men" linkText="View All →" />
              <ProductSection title="👗 Women's Collection" products={featuredProducts.filter(p => p.category === 'Women').slice(0, 6)} link="/shop?category=Women" linkText="View All →" />
              <ProductSection title="🧸 Kids Collection" products={featuredProducts.filter(p => p.category === 'Kid').slice(0, 6)} link="/shop?category=Kid" linkText="View All →" />
              <ProductSection title="🏠 Home Collection" products={featuredProducts.filter(p => p.category === 'Home Decorate').slice(0, 6)} link="/shop?category=Home%20Decorate" linkText="View All →" />
              <ProductSection title="⌚ Watch Collection" products={featuredProducts.filter(p => p.category === 'Watch').slice(0, 6)} link="/shop?category=Watch" linkText="View All →" />
            </>
          );
        })()}

        {/* ─── WHY SHOP WITH US ─── */}
        <section className="px-4 md:px-6 py-8 bg-slate-50 border-t border-slate-100 rounded-b-3xl">
          <h2 className="text-xl font-bold text-center text-slate-900 mb-8">Why Shop With Us</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-3">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Free Shipping</h3>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Secure Payment</h3>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-3">
                <RefreshCcw className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Easy Return</h3>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-3">
                <HeadphonesIcon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">24/7 Support</h3>
            </div>
          </div>
        </section>

      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
