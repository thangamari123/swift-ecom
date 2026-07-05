import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Youtube, ChevronDown } from 'lucide-react';
import { useStore } from '@/lib/store';

// ── Accordion item for mobile ──────────────────────────────────────────────
function AccordionSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full py-3.5 text-left"
        aria-expanded={open}
      >
        <span className="text-[13px] font-bold text-slate-800">{title}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {/* Smooth expand / collapse */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-64 opacity-100 mb-3' : 'max-h-0 opacity-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

// ── Main Footer ────────────────────────────────────────────────────────────
export function Footer() {
  const { storeSettings } = useStore();
  return (
    <footer className="bg-[#fafafa] pt-10 pb-24 md:pb-10 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ══════════════════════════════════════════════
            Desktop Footer (hidden on mobile)
        ══════════════════════════════════════════════ */}
        <div className="hidden md:block">
          <div className="flex justify-between items-start gap-8 mb-12">

            {/* Brand Info */}
            <div className="w-1/4 pr-4">
              <Link to="/" className="inline-block mb-4">
                {storeSettings?.logoUrl ? (
                  <img src={storeSettings.logoUrl} alt={storeSettings.storeName || 'SwiftStore'} className="h-12 max-w-[160px] object-contain" />
                ) : (
                  <img
                    src="https://res.cloudinary.com/dcldlvuib/image/upload/v1783062854/ChatGPT_Image_Jul_3_2026_12_41_53_PM_x2cays.png"
                    alt="SwiftStore"
                    className="h-12 w-auto object-contain"
                  />
                )}
              </Link>
              <p className="text-[13px] text-slate-500 mb-6 leading-relaxed">
                Your one-stop destination for premium fashion, watches, home essentials and more.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-slate-900 hover:text-slate-700 transition-colors"><Instagram className="w-5 h-5" /></a>
                <a href="#" className="text-slate-900 hover:text-slate-700 transition-colors"><Facebook className="w-5 h-5 fill-current" /></a>
                <a href="#" className="text-slate-900 hover:text-slate-700 transition-colors"><Twitter className="w-5 h-5 fill-current" /></a>
                <a href="#" className="text-slate-900 hover:text-slate-700 transition-colors"><Youtube className="w-5 h-5" /></a>
              </div>
            </div>

            {/* Shop */}
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

            {/* Customer Service */}
            <div>
              <h4 className="font-bold text-slate-900 mb-4 text-[14px]">Customer Service</h4>
              <ul className="space-y-3">
                <li><Link to="#" className="text-[13px] text-slate-600 hover:text-slate-900">Contact Us</Link></li>
                <li><Link to="#" className="text-[13px] text-slate-600 hover:text-slate-900">FAQs</Link></li>
                <li><Link to="#" className="text-[13px] text-slate-600 hover:text-slate-900">Shipping Policy</Link></li>
                <li><Link to="#" className="text-[13px] text-slate-600 hover:text-slate-900">Return &amp; Refund</Link></li>
                <li><Link to="#" className="text-[13px] text-slate-600 hover:text-slate-900">Track Order</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-slate-900 mb-4 text-[14px]">Company</h4>
              <ul className="space-y-3">
                <li><Link to="#" className="text-[13px] text-slate-600 hover:text-slate-900">About Us</Link></li>
                <li><Link to="#" className="text-[13px] text-slate-600 hover:text-slate-900">Careers</Link></li>
                <li><Link to="#" className="text-[13px] text-slate-600 hover:text-slate-900">Privacy Policy</Link></li>
                <li><Link to="#" className="text-[13px] text-slate-600 hover:text-slate-900">Terms &amp; Conditions</Link></li>
                <li><Link to="#" className="text-[13px] text-slate-600 hover:text-slate-900">Blog</Link></li>
              </ul>
            </div>

            {/* Payment Methods */}
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

          <div className="flex justify-between items-center text-[12px] text-slate-500 pb-2 font-medium">
            <div className="flex flex-col gap-0.5">
              <span>© 2026 SwiftStore. All Rights Reserved.</span>
              <span className="text-[11px] text-slate-400">
                Designed &amp; Developed by{' '}
                <a
                  href="https://www.rudrifix.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-slate-700 hover:text-indigo-600 transition-colors underline underline-offset-2"
                >
                  Rudrifix
                </a>
              </span>
            </div>
            <div className="flex space-x-6">
              <Link to="#" className="hover:text-slate-900">Privacy Policy</Link>
              <Link to="#" className="hover:text-slate-900">Terms &amp; Conditions</Link>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            Mobile Footer (hidden on desktop)
        ══════════════════════════════════════════════ */}
        <div className="md:hidden pt-2 pb-2">

          {/* Brand + Tagline */}
          <div className="flex flex-col items-center mb-5">
            <Link to="/" className="mb-2">
              {storeSettings?.logoUrl ? (
                <img src={storeSettings.logoUrl} alt={storeSettings.storeName || 'SwiftStore'} className="h-12 max-w-[140px] object-contain" />
              ) : (
                <img
                  src="https://res.cloudinary.com/dcldlvuib/image/upload/v1783062854/ChatGPT_Image_Jul_3_2026_12_41_53_PM_x2cays.png"
                  alt="SwiftStore"
                  className="h-12 w-auto max-w-[140px] object-contain"
                />
              )}
            </Link>
            <p className="text-[11px] text-slate-400 font-medium text-center max-w-[220px] leading-relaxed">
              Premium fashion, watches &amp; home essentials
            </p>
          </div>

          {/* Social Icons */}
          <div className="flex justify-center gap-3 mb-5">
            {[
              { icon: <Instagram className="w-4 h-4" />, label: 'Instagram' },
              { icon: <Facebook className="w-4 h-4 fill-current" />, label: 'Facebook' },
              { icon: <Twitter className="w-4 h-4 fill-current" />, label: 'Twitter' },
              { icon: <Youtube className="w-4 h-4" />, label: 'YouTube' },
            ].map(({ icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 active:bg-slate-200 transition-colors"
              >
                {icon}
              </a>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { emoji: '🚚', text: 'Free Shipping' },
              { emoji: '↩️', text: 'Easy Returns' },
              { emoji: '🔒', text: 'Secure Pay' },
            ].map(({ emoji, text }) => (
              <div key={text} className="flex flex-col items-center gap-1 bg-slate-50 rounded-xl py-3">
                <span className="text-lg leading-none">{emoji}</span>
                <span className="text-[10px] font-semibold text-slate-500 text-center leading-tight">{text}</span>
              </div>
            ))}
          </div>

          {/* ── Accordion Link Sections ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 mb-5 overflow-hidden">

            <AccordionSection title="Shop">
              <ul className="space-y-3 pl-1">
                <li><Link to="/category/Men" className="text-[12px] text-slate-500 font-medium">Men</Link></li>
                <li><Link to="/category/Women" className="text-[12px] text-slate-500 font-medium">Women</Link></li>
                <li><Link to="/category/Kids" className="text-[12px] text-slate-500 font-medium">Kids</Link></li>
                <li><Link to="/category/Watch" className="text-[12px] text-slate-500 font-medium">Watches</Link></li>
                <li><Link to="/category/Home%20Decorate" className="text-[12px] text-slate-500 font-medium">Home</Link></li>
              </ul>
            </AccordionSection>

            <AccordionSection title="Customer Service">
              <ul className="space-y-3 pl-1">
                <li><Link to="#" className="text-[12px] text-slate-500 font-medium">Contact Us</Link></li>
                <li><Link to="#" className="text-[12px] text-slate-500 font-medium">FAQs</Link></li>
                <li><Link to="#" className="text-[12px] text-slate-500 font-medium">Shipping Policy</Link></li>
                <li><Link to="#" className="text-[12px] text-slate-500 font-medium">Return &amp; Refund</Link></li>
                <li><Link to="#" className="text-[12px] text-slate-500 font-medium">Track Order</Link></li>
              </ul>
            </AccordionSection>

            <AccordionSection title="Company">
              <ul className="space-y-3 pl-1">
                <li><Link to="#" className="text-[12px] text-slate-500 font-medium">About Us</Link></li>
                <li><Link to="#" className="text-[12px] text-slate-500 font-medium">Careers</Link></li>
                <li><Link to="#" className="text-[12px] text-slate-500 font-medium">Privacy Policy</Link></li>
                <li><Link to="#" className="text-[12px] text-slate-500 font-medium">Terms &amp; Conditions</Link></li>
                <li><Link to="#" className="text-[12px] text-slate-500 font-medium">Blog</Link></li>
              </ul>
            </AccordionSection>

          </div>

          {/* Payment Methods */}
          <div className="flex justify-center gap-2 mb-5">
            <div className="h-8 px-3 bg-white rounded-md border border-slate-200 flex items-center justify-center shadow-sm">
              <span className="font-black text-blue-800 text-[11px] italic">VISA</span>
            </div>
            <div className="h-8 px-3 bg-white rounded-md border border-slate-200 flex items-center justify-center shadow-sm">
              <div className="flex -space-x-1.5 items-center">
                <div className="w-4 h-4 rounded-full bg-[#EA001B] mix-blend-multiply"></div>
                <div className="w-4 h-4 rounded-full bg-[#F7A000] mix-blend-multiply"></div>
              </div>
            </div>
            <div className="h-8 px-3 bg-white rounded-md border border-slate-200 flex items-center justify-center shadow-sm">
              <span className="font-bold text-[#003087] text-[11px] italic">PayPal</span>
            </div>
            <div className="h-8 px-3 bg-white rounded-md border border-slate-200 flex items-center justify-center shadow-sm">
              <span className="font-bold text-slate-700 text-[11px] tracking-tighter flex items-center">
                UPI<span className="text-green-600 text-base leading-none ml-0.5 relative top-[-1px]">›</span>
              </span>
            </div>
          </div>

          {/* Copyright + Legal */}
          <div className="flex flex-col items-center gap-2 pt-4 border-t border-slate-100">
            <div className="flex gap-4">
              <Link to="#" className="text-[10px] text-slate-400 font-medium">Privacy Policy</Link>
              <Link to="#" className="text-[10px] text-slate-400 font-medium">Terms &amp; Conditions</Link>
            </div>
            <p className="text-[10px] text-slate-400 font-medium text-center">
              © 2026 SwiftStore. All Rights Reserved.
            </p>
            <p className="text-[10px] text-slate-400 font-medium text-center">
              Designed &amp; Developed by{' '}
              <a
                href="https://www.rudrifix.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-slate-600 hover:text-indigo-600 transition-colors underline underline-offset-2"
              >
                Rudrifix
              </a>
            </p>
          </div>

        </div>
        {/* end mobile */}

      </div>
    </footer>
  );
}
