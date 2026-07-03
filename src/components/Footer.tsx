import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Youtube } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#fafafa] pt-10 pb-24 md:pb-10 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Desktop Footer (hidden on mobile) */}
        <div className="hidden md:block">
          <div className="flex justify-between items-start gap-8 mb-12">
            
            {/* Column 1: Brand Info */}
            <div className="w-1/4 pr-4">
              <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">SwiftStore</h2>
              <p className="text-[13px] text-slate-500 mb-6 leading-relaxed">
                Your one-stop destination for premium fashion, watches, home essentials and more.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-slate-900 hover:text-slate-700 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="text-slate-900 hover:text-slate-700 transition-colors">
                  <Facebook className="w-5 h-5 fill-current" />
                </a>
                <a href="#" className="text-slate-900 hover:text-slate-700 transition-colors">
                  <Twitter className="w-5 h-5 fill-current" />
                </a>
                <a href="#" className="text-slate-900 hover:text-slate-700 transition-colors">
                  <Youtube className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Column 2: Shop */}
            <div>
              <h4 className="font-bold text-slate-900 mb-4 text-[14px]">Shop</h4>
              <ul className="space-y-3">
                <li><Link to="/category/Men" className="text-[13px] text-slate-600 hover:text-slate-900">Men</Link></li>
                <li><Link to="/category/Women" className="text-[13px] text-slate-600 hover:text-slate-900">Women</Link></li>
                <li><Link to="/category/Kids" className="text-[13px] text-slate-600 hover:text-slate-900">Kids</Link></li>
                <li><Link to="/category/Watch" className="text-[13px] text-slate-600 hover:text-slate-900">Watches</Link></li>
                <li><Link to="/category/Home%20Decorate" className="text-[13px] text-slate-600 hover:text-slate-900">Home</Link></li>
              </ul>
            </div>

            {/* Column 3: Customer Service */}
            <div>
              <h4 className="font-bold text-slate-900 mb-4 text-[14px]">Customer Service</h4>
              <ul className="space-y-3">
                <li><Link to="#" className="text-[13px] text-slate-600 hover:text-slate-900">Contact Us</Link></li>
                <li><Link to="#" className="text-[13px] text-slate-600 hover:text-slate-900">FAQs</Link></li>
                <li><Link to="#" className="text-[13px] text-slate-600 hover:text-slate-900">Shipping Policy</Link></li>
                <li><Link to="#" className="text-[13px] text-slate-600 hover:text-slate-900">Return & Refund</Link></li>
                <li><Link to="#" className="text-[13px] text-slate-600 hover:text-slate-900">Track Order</Link></li>
              </ul>
            </div>

            {/* Column 4: Company */}
            <div>
              <h4 className="font-bold text-slate-900 mb-4 text-[14px]">Company</h4>
              <ul className="space-y-3">
                <li><Link to="#" className="text-[13px] text-slate-600 hover:text-slate-900">About Us</Link></li>
                <li><Link to="#" className="text-[13px] text-slate-600 hover:text-slate-900">Careers</Link></li>
                <li><Link to="#" className="text-[13px] text-slate-600 hover:text-slate-900">Privacy Policy</Link></li>
                <li><Link to="#" className="text-[13px] text-slate-600 hover:text-slate-900">Terms & Conditions</Link></li>
                <li><Link to="#" className="text-[13px] text-slate-600 hover:text-slate-900">Blog</Link></li>
              </ul>
            </div>

            {/* Column 5: Payment Methods */}
            <div>
              <h4 className="font-bold text-slate-900 mb-4 text-[14px]">Payment Methods</h4>
              <div className="flex gap-2">
                <div className="w-[42px] h-7 bg-white rounded border border-slate-200 flex items-center justify-center shadow-sm">
                  <span className="font-black text-blue-800 text-[9px] italic">VISA</span>
                </div>
                <div className="w-[42px] h-7 bg-white rounded border border-slate-200 flex items-center justify-center shadow-sm">
                   <div className="flex -space-x-1 items-center">
                     <div className="w-3 h-3 rounded-full bg-[#EA001B] mix-blend-multiply"></div>
                     <div className="w-3 h-3 rounded-full bg-[#F7A000] mix-blend-multiply"></div>
                   </div>
                </div>
                <div className="w-[42px] h-7 bg-white rounded border border-slate-200 flex items-center justify-center shadow-sm">
                  <span className="font-bold text-[#003087] text-[9px] italic">PayPal</span>
                </div>
                <div className="w-[42px] h-7 bg-white rounded border border-slate-200 flex items-center justify-center shadow-sm">
                  <span className="font-bold text-slate-700 text-[9px] tracking-tighter flex items-center">UPI<span className="text-green-600 text-xs leading-none ml-[1px] relative top-[-1px]">›</span></span>
                </div>
              </div>
            </div>
            
          </div>

          <hr className="border-slate-200 mb-5" />

          {/* Copyright Desktop */}
          <div className="flex justify-between items-center text-[12px] text-slate-500 pb-2 font-medium">
            <div>© 2026 SwiftStore. All Rights Reserved.</div>
            <div className="flex space-x-6">
              <Link to="#" className="hover:text-slate-900">Privacy Policy</Link>
              <Link to="#" className="hover:text-slate-900">Terms & Conditions</Link>
            </div>
          </div>
        </div>

        {/* Mobile Footer (hidden on desktop) */}
        <div className="md:hidden">
          {/* Follow Us Section */}
          <div className="flex flex-col items-center mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Follow Us</h3>
            <div className="flex space-x-6">
              <a href="#" className="text-slate-900 hover:text-slate-700 transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" className="text-slate-900 hover:text-slate-700 transition-colors">
                <Facebook className="w-6 h-6 fill-current" />
              </a>
              <a href="#" className="text-slate-900 hover:text-slate-700 transition-colors">
                <Twitter className="w-6 h-6 fill-current" />
              </a>
              <a href="#" className="text-slate-900 hover:text-slate-700 transition-colors">
                <Youtube className="w-6 h-6" />
              </a>
            </div>
          </div>

          <hr className="border-slate-200 mb-8" />

          {/* Links Section */}
          <div className="grid grid-cols-3 gap-2 mb-8 text-sm">
            {/* Shop */}
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Shop</h4>
              <ul className="space-y-4">
                <li><Link to="/category/Men" className="text-slate-600 hover:text-slate-900">Men</Link></li>
                <li><Link to="/category/Women" className="text-slate-600 hover:text-slate-900">Women</Link></li>
                <li><Link to="/category/Kids" className="text-slate-600 hover:text-slate-900">Kids</Link></li>
                <li><Link to="/category/Watch" className="text-slate-600 hover:text-slate-900">Watches</Link></li>
                <li><Link to="/category/Home%20Decorate" className="text-slate-600 hover:text-slate-900">Home</Link></li>
              </ul>
            </div>
            {/* Customer Service */}
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Customer Service</h4>
              <ul className="space-y-4">
                <li><Link to="#" className="text-slate-600 hover:text-slate-900">Contact Us</Link></li>
                <li><Link to="#" className="text-slate-600 hover:text-slate-900">FAQs</Link></li>
                <li><Link to="#" className="text-slate-600 hover:text-slate-900">Shipping Policy</Link></li>
                <li><Link to="#" className="text-slate-600 hover:text-slate-900">Return & Refund</Link></li>
                <li><Link to="#" className="text-slate-600 hover:text-slate-900">Track Order</Link></li>
              </ul>
            </div>
            {/* Company */}
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-4">
                <li><Link to="#" className="text-slate-600 hover:text-slate-900">About Us</Link></li>
                <li><Link to="#" className="text-slate-600 hover:text-slate-900">Careers</Link></li>
                <li><Link to="#" className="text-slate-600 hover:text-slate-900">Privacy Policy</Link></li>
                <li><Link to="#" className="text-slate-600 hover:text-slate-900 flex flex-wrap">Terms & Conditions</Link></li>
                <li><Link to="#" className="text-slate-600 hover:text-slate-900">Blog</Link></li>
              </ul>
            </div>
          </div>

          <hr className="border-slate-200 mb-8" />

          {/* Payment Methods */}
          <div className="mb-8">
            <h4 className="font-bold text-slate-900 mb-4">Payment Methods</h4>
            <div className="flex flex-wrap gap-3">
              <div className="w-16 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center shadow-sm">
                <span className="font-black text-blue-800 text-sm italic">VISA</span>
              </div>
              <div className="w-16 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center shadow-sm">
                 <div className="flex -space-x-1.5 items-center">
                   <div className="w-5 h-5 rounded-full bg-[#EA001B] mix-blend-multiply"></div>
                   <div className="w-5 h-5 rounded-full bg-[#F7A000] mix-blend-multiply"></div>
                 </div>
              </div>
              <div className="w-16 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center shadow-sm">
                <span className="font-bold text-[#003087] text-[13px] italic">PayPal</span>
              </div>
              <div className="w-16 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center shadow-sm">
                <span className="font-bold text-slate-700 text-[14px] tracking-tighter flex items-center">UPI<span className="text-green-600 text-xl leading-none ml-0.5 relative top-[-1px]">›</span></span>
              </div>
            </div>
          </div>
          
          <hr className="border-slate-200 mb-6" />

          {/* Copyright */}
          <div className="text-center text-[13px] text-slate-600 pb-2 font-medium">
            © 2026 SwiftStore. All Rights Reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
