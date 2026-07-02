import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp, where, limit, getDocs } from 'firebase/firestore';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { toast } from 'react-toastify';
import { Heart, ChevronLeft, Share2, Star } from 'lucide-react';

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
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  userName: string;
  createdAt: any;
}

export default function ProductDetailsPage() {
  const unwrappedParams = useParams() as { id: string };
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart, toggleWishlist, wishlist, user, requireAuth } = useStore();
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
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <div className="hidden md:block">
        <Navbar />
      </div>

      <main className="max-w-md mx-auto md:max-w-7xl relative">
        {/* Mobile Header */}
        <div className="md:hidden px-4 py-4 flex items-center justify-between sticky top-0 bg-white z-20">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-700">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-slate-700">
              <Share2 className="w-5 h-5" />
            </button>
            <button onClick={() => requireAuth(() => toggleWishlist(product.id))} className="p-2 text-slate-700 relative">
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 xl:gap-x-16 lg:px-8 lg:py-12">
          {/* Image Section */}
          <div className="flex flex-col">
            <div className="aspect-square w-full bg-[#f8f9fa] flex items-center justify-center p-8 md:rounded-2xl">
              <img
                src={images[activeImage]}
                alt={product.name}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Image Gallery */}
            <div className="flex gap-4 overflow-x-auto px-4 mt-4 pb-2 hide-scrollbar">
              {images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-16 h-16 rounded-xl bg-[#f8f9fa] flex-shrink-0 flex items-center justify-center p-2 border-2 ${activeImage === idx ? 'border-blue-600' : 'border-transparent'}`}
                >
                  <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 mt-6 sm:px-0 lg:mt-0">
            {/* Title & Rating */}
            <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900">{product.name}</h1>
            <div className="mt-2 flex items-center space-x-2">
              <div className="flex space-x-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-3.5 h-3.5 text-[#ffc107] fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-slate-500">4.8 (120) | 200+ sold</span>
            </div>

            {/* Price */}
            <div className="mt-4 flex items-end space-x-3">
              <p className="text-2xl font-bold text-slate-900">
                ₹{product.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-slate-400 line-through mb-1">
                ₹{originalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-2 py-1 rounded mb-1">
                -{discount}% OFF
              </span>
            </div>

            {/* Sizes */}
            {sizes.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-slate-900 mb-3">
                  Size: <span className="text-slate-500 font-normal">{selectedSize}</span>
                </h3>
                <div className="flex items-center flex-wrap gap-3">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                        selectedSize === size 
                          ? 'border-[#4F46E5] bg-[#4F46E5] text-white shadow-sm' 
                          : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-slate-900 mb-3">
                Color: <span className="text-slate-500 font-normal">{colors[selectedColor].name}</span>
              </h3>
              <div className="flex items-center space-x-3">
                {colors.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedColor(idx)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${selectedColor === idx ? 'border-blue-600' : 'border-transparent'}`}
                  >
                    <span 
                      className={`w-6 h-6 rounded-full border border-slate-200 shadow-sm`} 
                      style={{ backgroundColor: color.hex }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-slate-900 mb-3">Quantity</h3>
              <div className="flex items-center border border-slate-200 rounded-xl w-fit">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 text-slate-500 hover:text-slate-800 flex items-center justify-center">-</button>
                <span className="w-10 text-center font-medium text-sm">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 text-slate-500 hover:text-slate-800 flex items-center justify-center">+</button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-4">
              <button
                onClick={handleAddToCart}
                className="w-full bg-[#4F46E5] text-white rounded-xl py-3.5 flex items-center justify-center text-sm font-semibold hover:bg-[#4338ca] transition"
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl py-3.5 flex items-center justify-center text-sm font-semibold hover:bg-slate-50 transition"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-12 lg:px-8 px-4 pb-12">
          <div className="border-b border-slate-200">
            <div className="flex gap-8 overflow-x-auto hide-scrollbar">
              <button 
                onClick={() => setActiveTab('description')}
                className={`py-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'description' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Description
              </button>
              <button 
                onClick={() => setActiveTab('specifications')}
                className={`py-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'specifications' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Specifications
              </button>
              <button 
                onClick={() => setActiveTab('reviews')}
                className={`py-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'reviews' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Reviews <span className="bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs">{reviews.length}</span>
              </button>
            </div>
          </div>

          <div className="py-8">
            {activeTab === 'description' && (
              <div className="prose prose-sm prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed">
                  {product.description || 'No description available for this product.'}
                </p>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-6 rounded-2xl">
                    <h4 className="font-semibold text-slate-900 mb-2">Premium Quality</h4>
                    <p className="text-sm text-slate-600">Crafted with attention to detail and high-quality materials for long-lasting durability.</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl">
                    <h4 className="font-semibold text-slate-900 mb-2">Modern Design</h4>
                    <p className="text-sm text-slate-600">Sleek and contemporary aesthetics that perfectly complement your lifestyle.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="max-w-2xl">
                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  <div className="py-3 flex justify-between">
                    <span className="text-sm font-medium text-slate-500">Brand</span>
                    <span className="text-sm font-semibold text-slate-900">SwiftStore</span>
                  </div>
                  <div className="py-3 flex justify-between">
                    <span className="text-sm font-medium text-slate-500">Category</span>
                    <span className="text-sm font-semibold text-slate-900">{product.category}</span>
                  </div>
                  <div className="py-3 flex justify-between">
                    <span className="text-sm font-medium text-slate-500">Stock Status</span>
                    <span className="text-sm font-semibold text-slate-900">{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
                  </div>
                  <div className="py-3 flex justify-between">
                    <span className="text-sm font-medium text-slate-500">SKU</span>
                    <span className="text-sm font-semibold text-slate-900">{product.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <Star className="w-6 h-6 text-[#ffc107] fill-current" />
                    <span className="font-bold text-slate-900">{averageRating}</span>
                  <span className="text-sm text-slate-500">({reviews.length > 0 ? reviews.length : 120} reviews)</span>
                </div>
                </div>
                
                {/* Add Review Form */}
                <form onSubmit={handleSubmitReview} className="bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Write a Review</h4>
                  <div className="flex items-center space-x-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className="focus:outline-none"
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
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] outline-none placeholder:text-slate-400 min-h-[100px] resize-none mb-3"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="bg-slate-900 text-white rounded-lg px-6 py-2.5 text-sm font-semibold hover:bg-slate-800 transition disabled:bg-slate-300"
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>

                {/* Reviews List */}
                <div className="space-y-5">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div key={review.id} className="border-b border-slate-100 pb-5 last:border-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-sm text-slate-900">{review.userName}</p>
                            <p className="text-xs text-slate-500">
                              {review.createdAt ? new Date(review.createdAt.toDate ? review.createdAt.toDate() : review.createdAt).toLocaleDateString() : 'Just now'}
                            </p>
                          </div>
                          <div className="flex space-x-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`w-3.5 h-3.5 ${star <= review.rating ? 'text-[#ffc107] fill-current' : 'text-slate-300'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mt-2">{review.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 italic text-center py-4">No reviews yet. Be the first to review this product!</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-slate-100 pt-12 pb-20 lg:px-8 px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Related Products</h2>
              <Link to={`/shop?category=${product.category}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p) => (
                <Link
                  key={p.id}
                  to={`/product/${p.id}`}
                  className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative aspect-square bg-[#f8f9fa] flex items-center justify-center overflow-hidden p-4">
                    <img
                      src={p.imageUrl || `https://picsum.photos/seed/${p.id}/400/400`}
                      alt={p.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-sm font-bold text-slate-900 truncate mb-1">{p.name}</h3>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="font-black text-sm text-slate-900">
                        ₹{p.price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
