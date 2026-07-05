import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp, where, limit, getDocs } from 'firebase/firestore';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { toast } from 'react-toastify';
import { Heart, ChevronLeft, Share2, Star, ShoppingCart } from 'lucide-react';
import { generateSlug, getProductUrl } from '@/utils/slug';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  images?: string[];
  sizes?: string[];
  category: string;
  stock: number;
  slug?: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  userName: string;
  createdAt: any;
}

export default function ProductDetailsPage() {
  const unwrappedParams = useParams() as { id: string; slug?: string };
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart, toggleWishlist, wishlist, user, requireAuth, cart } = useStore();
  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(0);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');

  // Review states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');


  useEffect(() => {
    const docRef = doc(db, 'products', unwrappedParams.id);
    const unsubscribeProduct = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const productData = { id: docSnap.id, ...docSnap.data() } as Product;
        
        // Canonical SEO Redirect
        const canonicalSlug = productData.slug || generateSlug(productData.name);
        if (unwrappedParams.slug !== canonicalSlug) {
          navigate(`/product/${canonicalSlug}/${productData.id}`, { replace: true });
          return;
        }

        setProduct(productData);
        if (productData.sizes && productData.sizes.length > 0) {
          setSelectedSize(productData.sizes[0]);
        }

        // Fetch related products
        const fetchRelated = async () => {
          try {
            const relatedQuery = query(
              collection(db, 'products'),
              where('category', '==', productData.category),
              where('status', '==', 'Active'),
              limit(5)
            );
            const relatedSnap = await getDocs(relatedQuery);
            const related = relatedSnap.docs
              .map(d => ({ id: d.id, ...d.data() } as Product))
              .filter(p => p.id !== productData.id)
              .slice(0, 4);
            setRelatedProducts(related);
          } catch (error) {
            console.error("Error fetching related products:", error);
          }
        };
        fetchRelated();
        
      } else {
        setProduct(null);
      }
      setLoading(false);
    }, (error) => {
      console.log("Error fetching product", error);
      toast.error('Failed to load product details');
      setProduct(null);
      setLoading(false);
    });

    const reviewsQuery = query(
      collection(db, `products/${unwrappedParams.id}/reviews`),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
      const loadedReviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(loadedReviews);
    }, (error) => console.log('Reviews listener error:', error));
    
    return () => {
      unsubscribeProduct();
      unsubscribeReviews();
    };
  }, [unwrappedParams.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="px-4 py-4 animate-pulse">
          <div className="w-full aspect-square bg-slate-100 rounded-3xl mb-6"></div>
          <div className="h-8 bg-slate-200 rounded-md w-3/4 mb-3"></div>
          <div className="h-5 bg-slate-200 rounded-md w-1/4 mb-4"></div>
          <div className="flex gap-2 mb-6">
            <div className="w-24 h-6 bg-slate-200 rounded-full"></div>
            <div className="w-24 h-6 bg-slate-200 rounded-full"></div>
          </div>
          <div className="h-6 bg-slate-200 rounded-md w-1/3 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded-md w-full mb-2"></div>
          <div className="h-4 bg-slate-200 rounded-md w-full mb-2"></div>
          <div className="h-4 bg-slate-200 rounded-md w-2/3 mb-6"></div>
          <div className="h-14 bg-slate-200 rounded-2xl w-full"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xl text-slate-600">
        Product not found.
      </div>
    );
  }

  const isWishlisted = wishlist.includes(product.id);

  const handleAddToCart = () => {
    requireAuth(() => {
      addToCart({
        id: `${product.id}-${selectedSize}-${colors[selectedColor].name}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.imageUrl || 'https://picsum.photos/seed/product/400/400',
        size: selectedSize,
        color: colors[selectedColor].name
      });
      toast.success('Added to cart!');
    });
  };

  const handleBuyNow = () => {
    requireAuth(() => {
      addToCart({
        id: `${product.id}-${selectedSize}-${colors[selectedColor].name}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.imageUrl || 'https://picsum.photos/seed/product/400/400',
        size: selectedSize,
        color: colors[selectedColor].name
      });
      navigate('/checkout');
    });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    requireAuth(async () => {
      if (!newReviewComment.trim()) {
        toast.error('Please write a review comment');
        return;
      }
      
      setIsSubmittingReview(true);
      try {
        await addDoc(collection(db, `products/${unwrappedParams.id}/reviews`), {
          rating: newReviewRating,
          comment: newReviewComment,
          userName: user?.displayName || user?.email || 'Anonymous',
          userId: user?.uid,
          createdAt: serverTimestamp()
        });
        
        setNewReviewComment('');
        setNewReviewRating(5);
        toast.success('Review submitted successfully!');
      } catch (error) {
        console.error('Error submitting review:', error);
        toast.error('Failed to submit review');
      } finally {
        setIsSubmittingReview(false);
      }
    });
  };

  // Mock data for UI based on image
  const originalPrice = product.price * 1.33; // Mocking original price
  const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100);
  const images = (product.images && product.images.length > 0) ? product.images : [
    product.imageUrl || `https://picsum.photos/seed/${product.id}/800/800`,
    `https://picsum.photos/seed/${product.id}2/800/800`,
    `https://picsum.photos/seed/${product.id}3/800/800`,
    `https://picsum.photos/seed/${product.id}4/800/800`,
  ];
  const colors = [
    { name: 'Black', hex: '#000000' },
    { name: 'Blue', hex: '#1e3a8a' },
    { name: 'White', hex: '#ffffff' }
  ];
  const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : [];

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)
    : '4.8';

  return (
    <div className="bg-white min-h-screen font-sans pb-20 md:pb-0">
      {product && (
        <>
          <title>{product.name} | SwiftStore</title>
          <meta name="description" content={product.description.substring(0, 150)} />
          <link rel="canonical" href={`${window.location.origin}/product/${product.slug || generateSlug(product.name)}/${product.id}`} />
          <meta property="og:title" content={product.name} />
          <meta property="og:image" content={product.imageUrl} />
          <meta property="og:description" content={product.description.substring(0, 150)} />
          <meta name="twitter:card" content="summary_large_image" />
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": product.name,
              "image": [product.imageUrl, ...(product.images || [])],
              "description": product.description,
              "sku": product.id,
              "category": product.category,
              "offers": {
                "@type": "Offer",
                "url": `${window.location.origin}/product/${product.slug || generateSlug(product.name)}/${product.id}`,
                "priceCurrency": "INR",
                "price": product.price,
                "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                "itemCondition": "https://schema.org/NewCondition"
              }
            })}
          </script>
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [{
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": window.location.origin
              }, {
                "@type": "ListItem",
                "position": 2,
                "name": product.category,
                "item": `${window.location.origin}/category/${product.category}`
              }, {
                "@type": "ListItem",
                "position": 3,
                "name": product.name,
                "item": `${window.location.origin}/product/${product.slug || generateSlug(product.name)}/${product.id}`
              }]
            })}
          </script>
        </>
      )}
      <div className="hidden md:block">
        <Navbar />
      </div>

      <main className="max-w-md mx-auto md:max-w-7xl relative pb-24 md:pb-0">
        {/* Mobile Header (Floating) */}
        <div className="md:hidden absolute top-0 left-0 right-0 px-4 py-4 flex items-center justify-between z-20 pointer-events-none">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm text-slate-700 pointer-events-auto">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-3 pointer-events-auto">
            <button className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm text-slate-700">
              <Share2 className="w-5 h-5" />
            </button>
            <button onClick={() => requireAuth(() => toggleWishlist(product.id))} className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm text-slate-700 relative">
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            <Link to="/cart" className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm text-slate-700 relative">
              <ShoppingCart className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {cartItemsCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 xl:gap-x-16 lg:px-8 lg:py-12">
          {/* Image Section */}
          <div className="flex flex-col">
            {/* Desktop Image */}
            <div className="hidden md:flex aspect-square w-full bg-[#f8f9fa] items-center justify-center p-8 rounded-2xl">
              <img
                src={images[activeImage]}
                alt={product.name}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Mobile Image Carousel */}
            <div 
              className="md:hidden w-full aspect-[4/5] bg-[#f8f9fa] flex overflow-x-auto snap-x snap-mandatory hide-scrollbar relative"
              onScroll={(e) => {
                const scrollLeft = (e.target as HTMLDivElement).scrollLeft;
                const width = (e.target as HTMLDivElement).offsetWidth;
                setActiveImage(Math.round(scrollLeft / width));
              }}
            >
              {images.map((img, idx) => (
                <div key={idx} className="w-full flex-shrink-0 snap-center flex items-center justify-center p-4 pt-16">
                  <img
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    className="w-full h-full object-contain mix-blend-multiply"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
            
            {/* Mobile Dots */}
            <div className="md:hidden flex justify-center gap-1.5 mt-3 mb-1">
              {images.map((_, idx) => (
                <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeImage ? 'w-4 bg-slate-800' : 'w-1.5 bg-slate-300'}`} />
              ))}
            </div>
            
            {/* Desktop Image Gallery */}
            <div className="hidden md:flex gap-4 overflow-x-auto px-4 mt-4 pb-2 hide-scrollbar">
              {images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-16 h-16 rounded-xl bg-[#f8f9fa] flex-shrink-0 flex items-center justify-center p-2 border-2 ${activeImage === idx ? 'border-slate-900' : 'border-transparent'}`}
                >
                  <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 mt-5 sm:px-0 lg:mt-0">
            {/* Brand (Mock) & Ratings */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{product.category}</span>
              <div className="flex items-center space-x-1 bg-slate-100 px-2 py-1 rounded-full">
                <Star className="w-3 h-3 text-[#ffc107] fill-current" />
                <span className="text-[10px] font-bold text-slate-800">{averageRating}</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-lg md:text-3xl font-black tracking-tight text-slate-900 leading-snug">{product.name}</h1>

            {/* Price */}
            <div className="mt-3 md:mt-4 flex flex-wrap items-baseline gap-2">
              <p className="text-2xl md:text-3xl font-black text-slate-900">
                ₹{product.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-slate-400 line-through font-medium">
                ₹{originalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] font-black text-white bg-red-500 px-2 py-0.5 rounded-sm uppercase tracking-wide ml-1">
                {discount}% OFF
              </span>
            </div>

            {/* Sizes */}
            {sizes.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-between items-end mb-3">
                  <h3 className="text-sm font-bold text-slate-900">Size</h3>
                  <span className="text-xs font-medium text-indigo-600 underline">Size Guide</span>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`flex-1 min-w-[3.5rem] py-2 md:py-2.5 rounded-lg border text-xs md:text-sm font-bold transition-all ${
                        selectedSize === size 
                          ? 'border-slate-900 bg-slate-900 text-white shadow-md' 
                          : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            <div className="mt-6 md:mt-8">
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                Color: <span className="text-slate-500 font-medium ml-1">{colors[selectedColor].name}</span>
              </h3>
              <div className="flex items-center space-x-3">
                {colors.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedColor(idx)}
                    className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all ${selectedColor === idx ? 'ring-2 ring-offset-2 ring-slate-900' : 'ring-1 ring-slate-200'}`}
                  >
                    <span 
                      className={`w-7 h-7 md:w-8 md:h-8 rounded-full border border-black/10`} 
                      style={{ backgroundColor: color.hex }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mt-6 md:mt-8 pb-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Quantity</h3>
              <div className="flex items-center border border-slate-200 rounded-xl w-fit bg-slate-50">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 text-slate-600 hover:text-slate-900 flex items-center justify-center font-medium text-lg">-</button>
                <span className="w-10 text-center font-bold text-sm">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 text-slate-600 hover:text-slate-900 flex items-center justify-center font-medium text-lg">+</button>
              </div>
            </div>

            {/* Action Buttons (Desktop only, Mobile moved to sticky bottom) */}
            <div className="mt-8 hidden md:flex space-x-4">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-slate-100 text-slate-900 rounded-xl py-4 flex items-center justify-center text-sm font-bold hover:bg-slate-200 transition"
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 bg-slate-900 text-white rounded-xl py-4 flex items-center justify-center text-sm font-bold hover:bg-slate-800 transition shadow-md shadow-slate-900/20"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-8 lg:px-8 px-4 pb-12">
          <div className="border-b border-slate-200 sticky top-14 md:top-0 bg-white z-10">
            <div className="flex gap-6 overflow-x-auto hide-scrollbar">
              <button 
                onClick={() => setActiveTab('description')}
                className={`py-3 md:py-4 text-xs md:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'description' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
              >
                Description
              </button>
              <button 
                onClick={() => setActiveTab('specifications')}
                className={`py-3 md:py-4 text-xs md:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'specifications' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
              >
                Specifications
              </button>
              <button 
                onClick={() => setActiveTab('reviews')}
                className={`py-3 md:py-4 text-xs md:text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${activeTab === 'reviews' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
              >
                Reviews <span className={`py-0.5 px-1.5 rounded-md text-[10px] ${activeTab === 'reviews' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{reviews.length}</span>
              </button>
            </div>
          </div>

          <div className="py-6">
            {activeTab === 'description' && (
              <div className="prose prose-sm md:prose-base prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed text-sm">
                  {product.description || 'No description available for this product.'}
                </p>
                <div className="mt-6 space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <h4 className="font-bold text-slate-900 mb-1.5 text-sm">Premium Quality</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Crafted with attention to detail and high-quality materials for long-lasting durability.</p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <h4 className="font-bold text-slate-900 mb-1.5 text-sm">Modern Design</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Sleek and contemporary aesthetics that perfectly complement your lifestyle.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="max-w-2xl bg-slate-50 rounded-xl p-4 md:p-6 border border-slate-100">
                <div className="divide-y divide-slate-200/60">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-xs md:text-sm font-medium text-slate-500">Brand</span>
                    <span className="text-xs md:text-sm font-bold text-slate-900">SwiftStore</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-xs md:text-sm font-medium text-slate-500">Category</span>
                    <span className="text-xs md:text-sm font-bold text-slate-900">{product.category}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-xs md:text-sm font-medium text-slate-500">Stock Status</span>
                    <span className="text-xs md:text-sm font-bold text-slate-900">{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-xs md:text-sm font-medium text-slate-500">SKU</span>
                    <span className="text-xs md:text-sm font-bold text-slate-900">{product.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="max-w-3xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <Star className="w-6 h-6 md:w-8 md:h-8 text-[#ffc107] fill-current" />
                    <span className="text-2xl md:text-3xl font-black text-slate-900">{averageRating}</span>
                    <span className="text-xs md:text-sm font-medium text-slate-500 mt-1">({reviews.length > 0 ? reviews.length : 120} reviews)</span>
                  </div>
                </div>
                
                {/* Add Review Form */}
                <form onSubmit={handleSubmitReview} className="bg-slate-50 rounded-xl p-4 md:p-6 mb-8 border border-slate-100">
                  <h4 className="text-xs md:text-sm font-bold text-slate-900 mb-3">Write a Review</h4>
                  <div className="flex items-center space-x-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star 
                          className={`w-6 h-6 ${star <= newReviewRating ? 'text-[#ffc107] fill-current' : 'text-slate-300'}`} 
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    placeholder="Share your thoughts about this product..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs md:text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none placeholder:text-slate-400 min-h-[90px] resize-none mb-3 transition-shadow shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="w-full md:w-auto bg-slate-900 text-white rounded-xl px-6 py-3 text-xs md:text-sm font-bold hover:bg-slate-800 transition shadow-md disabled:bg-slate-300 disabled:shadow-none"
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>

                {/* Reviews List */}
                <div className="space-y-4 md:space-y-6">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div key={review.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-1.5">
                          <div>
                            <p className="font-bold text-xs md:text-sm text-slate-900">{review.userName}</p>
                            <p className="text-[10px] md:text-xs text-slate-400 font-medium mt-0.5">
                              {review.createdAt ? new Date(review.createdAt.toDate ? review.createdAt.toDate() : review.createdAt).toLocaleDateString() : 'Just now'}
                            </p>
                          </div>
                          <div className="flex space-x-0.5 bg-slate-50 px-1.5 py-1 rounded-md border border-slate-100">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`w-3 h-3 ${star <= review.rating ? 'text-[#ffc107] fill-current' : 'text-slate-200'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs md:text-sm text-slate-600 leading-relaxed mt-2">{review.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs md:text-sm text-slate-400 font-medium italic text-center py-6">No reviews yet. Be the first to review this product!</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-slate-100 pt-8 pb-10 lg:px-8 px-4">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-lg md:text-2xl font-black text-slate-900">You Might Also Like</h2>
              <Link to={`/category/${product.category}`} className="text-xs md:text-sm font-bold text-indigo-600 hover:text-indigo-700">
                View All
              </Link>
            </div>
            {/* Horizontal scroll on mobile, grid on desktop */}
            <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-6 overflow-x-auto md:overflow-visible pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar snap-x snap-mandatory">
              {relatedProducts.map((p) => (
                <Link
                  key={p.id}
                  to={getProductUrl(p)}
                  className="group flex-none w-[40vw] md:w-auto snap-start flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all duration-300 md:hover:-translate-y-1"
                >
                  <div className="relative aspect-[4/5] bg-[#f8f9fa] flex items-center justify-center overflow-hidden p-4">
                    <img
                      src={p.imageUrl || `https://picsum.photos/seed/${p.id}/400/500`}
                      alt={p.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-3 md:p-4 flex flex-col flex-1">
                    <h3 className="text-xs md:text-sm font-bold text-slate-900 truncate mb-1">{p.name}</h3>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="font-black text-xs md:text-sm text-slate-900">
                        ₹{p.price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Sticky Mobile Action Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 pb-5 flex gap-3 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <button
            onClick={handleAddToCart}
            className="flex-[0.8] bg-slate-100 text-slate-900 rounded-xl py-3.5 flex items-center justify-center text-xs font-bold hover:bg-slate-200 transition"
          >
            Add to Cart
          </button>
          <button
            onClick={handleBuyNow}
            className="flex-1 bg-slate-900 text-white rounded-xl py-3.5 flex items-center justify-center text-xs font-bold shadow-md shadow-slate-900/20"
          >
            Buy Now
          </button>
        </div>
      </main>

      <Footer />
      <div className="hidden md:block">
        <BottomNav />
      </div>
    </div>
  );
}
