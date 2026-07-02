import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <div className="hidden md:block">
        <Navbar />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-16">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-6">About SwiftStore</h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Welcome to SwiftStore, your number one source for all things premium. We're dedicated to providing you the very best products, with an emphasis on quality, fast delivery, and exceptional customer service.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div className="rounded-2xl overflow-hidden shadow-lg h-[400px]">
            <img 
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000" 
              alt="About Us" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-900">Our Story</h2>
            <p className="text-slate-600 leading-relaxed text-lg">
              Founded in 2024, SwiftStore has come a long way from its beginnings. When we first started out, our passion for high-quality, accessible products drove us to do intense research, and gave us the impetus to turn hard work and inspiration into to a booming online store.
            </p>
            <p className="text-slate-600 leading-relaxed text-lg">
              We now serve customers all over the world, and are thrilled to be a part of the quirky, eco-friendly, fair trade wing of the e-commerce industry.
            </p>
          </div>
        </div>

        <div className="bg-[#F8F9FA] rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Mission</h2>
          <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
            "To empower our customers with a seamless shopping experience by offering a curated selection of premium products, unbeatable prices, and a customer-first approach that guarantees satisfaction with every purchase."
          </p>
        </div>
      </div>

      <div className="md:hidden">
        <Navbar />
      </div>
      <BottomNav />
      <Footer />
    </div>
  );
}
