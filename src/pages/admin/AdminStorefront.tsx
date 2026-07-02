import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { Save, Plus, Trash2, GripVertical } from 'lucide-react';
import { useAdminRoleGuard } from '@/hooks/useAdminRoleGuard';

export default function AdminStorefront() {
  useAdminRoleGuard(['Administrator', 'Manager', 'Editor']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>({
    sectionConfig: {
      heroSlider: { title: "Hero Slider", enabled: true },
      greatestSale: { title: "Greatest Sale Of All Time", enabled: true },
      lovedOnes: { title: "Shop for loved ones", enabled: true },
      priceWise: { title: "Price-wise Collections", enabled: true },
      summerSpecials: { title: "Summer Specials", enabled: true },
      occasionCollections: { title: "Occasion Specific Collections", enabled: true },
      shopByCategory: { title: "Shop by Category", enabled: true }
    },
    heroSlides: [
      {
        title: "Sports shoes, slippers...",
        discount: "Min. 60% Off",
        bgColor: "bg-gradient-to-br from-[#FFF8B5] to-[#FCE38A]",
        image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=400&auto=format&fit=crop",
        logos: "PUMA, Reebok",
        decorations: true
      }
    ],
    greatestSale: {
      title: "Greatest\nSale Of All\nTime",
      subtitle: "Coming soon",
      image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=400&auto=format&fit=crop"
    },
    priceWise: [
      { price: 299, link: "/shop?maxPrice=299", image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=400&auto=format&fit=crop", bgColor: "#F5F2DF", textColor: "#A59239" },
      { price: 399, link: "/shop?maxPrice=399", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop", bgColor: "#FCE5EB", textColor: "#C7496B" },
      { price: 599, link: "/shop?maxPrice=599", image: "https://images.unsplash.com/photo-1612336307429-8a898d10e223?q=80&w=400&auto=format&fit=crop", bgColor: "#FCE5EB", textColor: "#C7496B" },
      { price: 799, link: "/shop?maxPrice=799", image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=400&auto=format&fit=crop", bgColor: "#E9F5DF", textColor: "#A52A4A" }
    ],
    summerSpecials: [
      { title: "Tees, shirts...", subtitle: "From ₹199", image: "https://images.unsplash.com/photo-1521369909029-2afed882ba54?q=80&w=400&auto=format&fit=crop", link: "/shop?category=Men" },
      { title: "Dresses, tops...", subtitle: "From ₹149", image: "https://images.unsplash.com/photo-1515347619362-e67c87c714ec?q=80&w=400&auto=format&fit=crop", link: "/shop?category=Women" },
      { title: "Slides, flip-flops...", subtitle: "From ₹119", image: "https://images.unsplash.com/photo-1562183241-b937e95585b6?q=80&w=400&auto=format&fit=crop", link: "/shop?category=Casual" },
      { title: "Kids' combo sets", subtitle: "From ₹149", image: "https://images.unsplash.com/photo-1519238382377-50b2b8c9dce8?q=80&w=400&auto=format&fit=crop", link: "/shop?category=Kids" },
      { title: "Women's clogs...", subtitle: "From ₹129", image: "https://images.unsplash.com/photo-1555355609-b6dc245230c1?q=80&w=400&auto=format&fit=crop", link: "/shop?category=Women" },
      { title: "Cotton sets", subtitle: "Min. 70% Off", image: "https://images.unsplash.com/photo-1610486810214-7e0b510ed2d4?q=80&w=400&auto=format&fit=crop", link: "/shop?category=Women" }
    ],
    occasionCollections: [
      { title: "OFFICE", emoji: "🌿", image: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=400&auto=format&fit=crop", link: "/shop?category=Office" },
      { title: "VACATION", emoji: "🐚", image: "https://images.unsplash.com/photo-1523455799793-1815db97669a?q=80&w=400&auto=format&fit=crop", link: "/shop?category=Vacation" },
      { title: "CASUAL", emoji: "🌺", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop", link: "/shop?category=Casual" },
      { title: "PARTY", emoji: "🍊", image: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=400&auto=format&fit=crop", link: "/shop?category=Party" }
    ],
    lovedOnes: [
      { title: "Men", image: "https://images.unsplash.com/photo-1516826957135-700ede19c111?q=80&w=400&auto=format&fit=crop", link: "/shop?category=Men", gradient: "from-orange-100/30" },
      { title: "Women", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=400&auto=format&fit=crop", link: "/shop?category=Women", gradient: "from-red-100/30" },
      { title: "Gen Z drips", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=400&auto=format&fit=crop", link: "/shop?category=Gen%20Z", gradient: "from-green-100/30" }
    ],
    shopByCategory: [
      { name: 'Men', image: 'https://images.unsplash.com/photo-1516826957135-700ede19c111?w=600', label: 'Men' },
      { name: 'Women', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600', label: 'Women' },
      { name: 'Kid', image: 'https://images.unsplash.com/photo-1519238382377-50b2b8c9dce8?w=600', label: 'Kids' },
      { name: 'Home Decorate', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600', label: 'Home' },
      { name: 'Watch', image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600', label: 'Watches' }
    ]
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const docRef = doc(db, 'storefront', 'homepage');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setConfig(docSnap.data());
      }
    } catch (error) {
      console.error('Error fetching storefront config:', error);
      toast.error('Failed to load storefront configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'storefront', 'homepage'), config);
      toast.success('Storefront configuration saved successfully!');
    } catch (error) {
      console.error('Error saving storefront config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (section: string, index: number, field: string, value: any) => {
    setConfig((prev: any) => {
      const newSection = [...prev[section]];
      newSection[index] = { ...newSection[index], [field]: value };
      return { ...prev, [section]: newSection };
    });
  };

  const updateObject = (section: string, field: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateSectionConfig = (sectionKey: string, field: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      sectionConfig: {
        ...(prev.sectionConfig || {}),
        [sectionKey]: {
          ...(prev.sectionConfig?.[sectionKey] || {}),
          [field]: value
        }
      }
    }));
  };

  const getSectionTitle = (sectionKey: string, defaultTitle: string) => {
    return config.sectionConfig?.[sectionKey]?.title ?? defaultTitle;
  };

  const getSectionEnabled = (sectionKey: string) => {
    return config.sectionConfig?.[sectionKey]?.enabled ?? true;
  };

  const addSlide = () => {
    setConfig((prev: any) => ({
      ...prev,
      heroSlides: [...prev.heroSlides, { title: 'New Slide', discount: 'Flat 50% Off', bgColor: 'bg-slate-100', image: '', logos: '', decorations: false }]
    }));
  };

  const removeSlide = (index: number) => {
    setConfig((prev: any) => {
      const newSlides = [...prev.heroSlides];
      newSlides.splice(index, 1);
      return { ...prev, heroSlides: newSlides };
    });
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Storefront Configuration</h2>
            <p className="text-sm text-slate-500 mt-1">Manage homepage banners, sliders, and featured sections.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Hero Slider */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex-1 w-full flex items-center gap-4">
              <input 
                type="text" 
                value={getSectionTitle('heroSlider', 'Hero Slider')} 
                onChange={(e) => updateSectionConfig('heroSlider', 'title', e.target.value)}
                className="text-lg font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none bg-transparent"
                placeholder="Section Title"
              />
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="enable-heroSlider"
                  checked={getSectionEnabled('heroSlider')} 
                  onChange={(e) => updateSectionConfig('heroSlider', 'enabled', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="enable-heroSlider" className="ml-2 text-sm font-medium text-slate-700">Enable</label>
              </div>
            </div>
            <button onClick={addSlide} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center whitespace-nowrap">
              <Plus className="w-4 h-4 mr-1" /> Add Slide
            </button>
          </div>
          
          <div className="space-y-6">
            {config.heroSlides?.map((slide: any, index: number) => (
              <div key={index} className="flex gap-4 items-start p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="mt-2 text-slate-400 cursor-move">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
                    <input 
                      type="text" 
                      value={slide.title} 
                      onChange={(e) => updateSection('heroSlides', index, 'title', e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Discount Text</label>
                    <input 
                      type="text" 
                      value={slide.discount} 
                      onChange={(e) => updateSection('heroSlides', index, 'discount', e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Background Gradient Class</label>
                    <input 
                      type="text" 
                      value={slide.bgColor} 
                      onChange={(e) => updateSection('heroSlides', index, 'bgColor', e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Image URL</label>
                    <input 
                      type="text" 
                      value={slide.image} 
                      onChange={(e) => updateSection('heroSlides', index, 'image', e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Logos (comma separated)</label>
                    <input 
                      type="text" 
                      value={slide.logos} 
                      onChange={(e) => updateSection('heroSlides', index, 'logos', e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                  <div className="flex items-center mt-6">
                    <input 
                      type="checkbox" 
                      checked={slide.decorations} 
                      onChange={(e) => updateSection('heroSlides', index, 'decorations', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <label className="ml-2 text-xs font-semibold text-slate-600">Show leaf decorations</label>
                  </div>
                </div>
                <button 
                  onClick={() => removeSlide(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors mt-6"
                  title="Remove Slide"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Shop by Category */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex-1 w-full flex items-center gap-4">
              <input 
                type="text" 
                value={getSectionTitle('shopByCategory', 'Shop by Category')} 
                onChange={(e) => updateSectionConfig('shopByCategory', 'title', e.target.value)}
                className="text-lg font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none bg-transparent"
                placeholder="Section Title"
              />
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="enable-shopByCategory"
                  checked={getSectionEnabled('shopByCategory')} 
                  onChange={(e) => updateSectionConfig('shopByCategory', 'enabled', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="enable-shopByCategory" className="ml-2 text-sm font-medium text-slate-700">Enable</label>
              </div>
            </div>
            <button 
              onClick={() => setConfig((prev: any) => ({ ...prev, shopByCategory: [...(prev.shopByCategory || []), { label: 'New Category', name: 'New Category', image: '' }] }))} 
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Category
            </button>
          </div>
          
          <div className="space-y-4">
            {config.shopByCategory?.map((item: any, index: number) => (
              <div key={index} className="flex gap-4 items-start p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="mt-2 text-slate-400 cursor-move">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Display Label</label>
                    <input 
                      type="text" 
                      value={item.label} 
                      onChange={(e) => updateSection('shopByCategory', index, 'label', e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Category Name (for Link)</label>
                    <input 
                      type="text" 
                      value={item.name} 
                      onChange={(e) => updateSection('shopByCategory', index, 'name', e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Image URL</label>
                    <input 
                      type="text" 
                      value={item.image} 
                      onChange={(e) => updateSection('shopByCategory', index, 'image', e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setConfig((prev: any) => {
                      const newCategories = [...prev.shopByCategory];
                      newCategories.splice(index, 1);
                      return { ...prev, shopByCategory: newCategories };
                    });
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors mt-6"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Greatest Sale Banner */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-4">
            <input 
              type="text" 
              value={getSectionTitle('greatestSale', 'Greatest Sale Banner')} 
              onChange={(e) => updateSectionConfig('greatestSale', 'title', e.target.value)}
              className="text-lg font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none bg-transparent flex-1"
              placeholder="Section Title"
            />
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="enable-greatestSale"
                checked={getSectionEnabled('greatestSale')} 
                onChange={(e) => updateSectionConfig('greatestSale', 'enabled', e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="enable-greatestSale" className="ml-2 text-sm font-medium text-slate-700">Enable</label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Title (use \n for newlines)</label>
              <textarea 
                rows={3}
                value={config.greatestSale?.title || ''} 
                onChange={(e) => updateObject('greatestSale', 'title', e.target.value)}
                className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Subtitle</label>
              <input 
                type="text" 
                value={config.greatestSale?.subtitle || ''} 
                onChange={(e) => updateObject('greatestSale', 'subtitle', e.target.value)}
                className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 mb-4" 
              />
              <label className="block text-xs font-semibold text-slate-600 mb-1">Image URL</label>
              <input 
                type="text" 
                value={config.greatestSale?.image || ''} 
                onChange={(e) => updateObject('greatestSale', 'image', e.target.value)}
                className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
              />
            </div>
          </div>
        </div>

        {/* Shop for Loved Ones */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex-1 w-full flex items-center gap-4">
              <input 
                type="text" 
                value={getSectionTitle('lovedOnes', 'Shop for Loved Ones')} 
                onChange={(e) => updateSectionConfig('lovedOnes', 'title', e.target.value)}
                className="text-lg font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none bg-transparent"
                placeholder="Section Title"
              />
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="enable-lovedOnes"
                  checked={getSectionEnabled('lovedOnes')} 
                  onChange={(e) => updateSectionConfig('lovedOnes', 'enabled', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="enable-lovedOnes" className="ml-2 text-sm font-medium text-slate-700">Enable</label>
              </div>
            </div>
            <button 
              onClick={() => setConfig((prev: any) => ({ ...prev, lovedOnes: [...(prev.lovedOnes || []), { title: 'New Item', image: '', link: '/shop', gradient: 'from-blue-100/30' }] }))} 
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Category
            </button>
          </div>
          
          <div className="space-y-4">
            {config.lovedOnes?.map((item: any, index: number) => (
              <div key={index} className="flex gap-4 items-start p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
                    <input 
                      type="text" 
                      value={item.title} 
                      onChange={(e) => updateSection('lovedOnes', index, 'title', e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Gradient Class (e.g. from-orange-100/30)</label>
                    <input 
                      type="text" 
                      value={item.gradient} 
                      onChange={(e) => updateSection('lovedOnes', index, 'gradient', e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Image URL</label>
                    <input 
                      type="text" 
                      value={item.image} 
                      onChange={(e) => updateSection('lovedOnes', index, 'image', e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Link URL</label>
                    <input 
                      type="text" 
                      value={item.link} 
                      onChange={(e) => updateSection('lovedOnes', index, 'link', e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setConfig((prev: any) => {
                      const newLovedOnes = [...prev.lovedOnes];
                      newLovedOnes.splice(index, 1);
                      return { ...prev, lovedOnes: newLovedOnes };
                    });
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors mt-6"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Price-wise Collections */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex-1 w-full flex items-center gap-4">
              <input 
                type="text" 
                value={getSectionTitle('priceWise', 'Price-wise Collections')} 
                onChange={(e) => updateSectionConfig('priceWise', 'title', e.target.value)}
                className="text-lg font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none bg-transparent"
                placeholder="Section Title"
              />
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="enable-priceWise"
                  checked={getSectionEnabled('priceWise')} 
                  onChange={(e) => updateSectionConfig('priceWise', 'enabled', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="enable-priceWise" className="ml-2 text-sm font-medium text-slate-700">Enable</label>
              </div>
            </div>
            <button 
              onClick={() => setConfig((prev: any) => ({ ...prev, priceWise: [...(prev.priceWise || []), { price: 999, link: '/shop?maxPrice=999', image: '', bgColor: '#FFFFFF', textColor: '#000000' }] }))} 
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Price Level
            </button>
          </div>
          
          <div className="space-y-4">
            {config.priceWise?.map((item: any, index: number) => (
              <div key={index} className="flex gap-4 items-start p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Price Limit</label>
                    <input 
                      type="number" 
                      value={item.price} 
                      onChange={(e) => updateSection('priceWise', index, 'price', e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Link URL</label>
                    <input 
                      type="text" 
                      value={item.link} 
                      onChange={(e) => updateSection('priceWise', index, 'link', e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Image URL</label>
                    <input 
                      type="text" 
                      value={item.image} 
                      onChange={(e) => updateSection('priceWise', index, 'image', e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">BG Color</label>
                      <input 
                        type="color" 
                        value={item.bgColor} 
                        onChange={(e) => updateSection('priceWise', index, 'bgColor', e.target.value)}
                        className="w-full h-9 border border-slate-300 rounded" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Text Color</label>
                      <input 
                        type="color" 
                        value={item.textColor} 
                        onChange={(e) => updateSection('priceWise', index, 'textColor', e.target.value)}
                        className="w-full h-9 border border-slate-300 rounded" 
                      />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setConfig((prev: any) => {
                      const newPriceWise = [...prev.priceWise];
                      newPriceWise.splice(index, 1);
                      return { ...prev, priceWise: newPriceWise };
                    });
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors mt-6"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Summer Specials */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex-1 w-full flex items-center gap-4">
              <input 
                type="text" 
                value={getSectionTitle('summerSpecials', 'Summer Specials')} 
                onChange={(e) => updateSectionConfig('summerSpecials', 'title', e.target.value)}
                className="text-lg font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none bg-transparent"
                placeholder="Section Title"
              />
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="enable-summerSpecials"
                  checked={getSectionEnabled('summerSpecials')} 
                  onChange={(e) => updateSectionConfig('summerSpecials', 'enabled', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="enable-summerSpecials" className="ml-2 text-sm font-medium text-slate-700">Enable</label>
              </div>
            </div>
            <button 
              onClick={() => setConfig((prev: any) => ({ ...prev, summerSpecials: [...(prev.summerSpecials || []), { title: 'New Item', subtitle: 'From ₹199', image: '', link: '/shop' }] }))} 
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Summer Special
            </button>
          </div>
          
          <div className="space-y-4">
            {config.summerSpecials?.map((item: any, index: number) => (
              <div key={index} className="flex gap-4 items-start p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
                    <input 
                      type="text" 
                      value={item.title} 
                      onChange={(e) => updateSection('summerSpecials', index, 'title', e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Subtitle</label>
                    <input 
                      type="text" 
                      value={item.subtitle} 
                      onChange={(e) => updateSection('summerSpecials', index, 'subtitle', e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Image URL</label>
                    <input 
                      type="text" 
                      value={item.image} 
                      onChange={(e) => updateSection('summerSpecials', index, 'image', e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Link URL</label>
                    <input 
                      type="text" 
                      value={item.link} 
                      onChange={(e) => updateSection('summerSpecials', index, 'link', e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setConfig((prev: any) => {
                      const newSpecials = [...prev.summerSpecials];
                      newSpecials.splice(index, 1);
                      return { ...prev, summerSpecials: newSpecials };
                    });
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors mt-6"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Occasion Specific Collections */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex-1 w-full flex items-center gap-4">
              <input 
                type="text" 
                value={getSectionTitle('occasionCollections', 'Occasion Specific Collections')} 
                onChange={(e) => updateSectionConfig('occasionCollections', 'title', e.target.value)}
                className="text-lg font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none bg-transparent"
                placeholder="Section Title"
              />
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="enable-occasionCollections"
                  checked={getSectionEnabled('occasionCollections')} 
                  onChange={(e) => updateSectionConfig('occasionCollections', 'enabled', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="enable-occasionCollections" className="ml-2 text-sm font-medium text-slate-700">Enable</label>
              </div>
            </div>
            <button 
              onClick={() => setConfig((prev: any) => ({ ...prev, occasionCollections: [...(prev.occasionCollections || []), { title: 'OFFICE', emoji: '🌿', image: '', link: '/shop' }] }))} 
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Occasion
            </button>
          </div>
          
          <div className="space-y-4">
            {config.occasionCollections?.map((item: any, index: number) => (
              <div key={index} className="flex gap-4 items-start p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
                    <input 
                      type="text" 
                      value={item.title} 
                      onChange={(e) => updateSection('occasionCollections', index, 'title', e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Emoji</label>
                    <input 
                      type="text" 
                      value={item.emoji} 
                      onChange={(e) => updateSection('occasionCollections', index, 'emoji', e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Image URL</label>
                    <input 
                      type="text" 
                      value={item.image} 
                      onChange={(e) => updateSection('occasionCollections', index, 'image', e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Link URL</label>
                    <input 
                      type="text" 
                      value={item.link} 
                      onChange={(e) => updateSection('occasionCollections', index, 'link', e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setConfig((prev: any) => {
                      const newOccasions = [...prev.occasionCollections];
                      newOccasions.splice(index, 1);
                      return { ...prev, occasionCollections: newOccasions };
                    });
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors mt-6"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
