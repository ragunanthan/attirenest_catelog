"use client";

import React, { useEffect, useState, useRef } from 'react';

type Category = {
  id: string;
  name: string;
  description: string;
  theme: string;
};

type Product = {
  id: number;
  categoryId: string;
  name: string;
  features: string;
  description: string;
  basePrice: number;
  ageRange: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  image: string;
};

type CatalogueProps = {
  initialCategories: Category[];
  initialProducts: Product[];
};

type CartItem = {
  id: number;
  name: string;
  year: number;
  price: number;
  qty: number;
};

const yearMultiplier: Record<number, number> = {1:1, 2:1, 3:1.05, 4:1.1, 5:1.15, 6:1.2, 7:1.25, 8:1.3, 9:1.35, 10:1.4};

export default function Catalogue({ initialCategories, initialProducts }: CatalogueProps) {
  const [categories] = useState<Category[]>(initialCategories);
  const [products] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(initialCategories.length > 0 ? initialCategories[0].id : '');
  
  // State for selections and animations per product
  const [selections, setSelections] = useState<Record<number, number>>({});
  
  // Initialize prices based on basePrice from initialProducts
  const [prices, setPrices] = useState<Record<number, number>>(() => {
    const initPrices: Record<number, number> = {};
    initialProducts.forEach((p: Product) => {
      initPrices[p.id] = p.basePrice;
    });
    return initPrices;
  });

  const [animatingPrices, setAnimatingPrices] = useState<Record<number, boolean>>({});
  const [addedFlags, setAddedFlags] = useState<Record<number, boolean>>({});

  const sectionsRef = useRef<(HTMLElement | null)[]>([]);

  // The intersection observer effect for tabs
  useEffect(() => {
    if (categories.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveTab(entry.target.id);
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    sectionsRef.current.forEach(section => {
      if (section) observer.observe(section);
    });

    return () => {
      observer.disconnect();
    };
  }, [categories, products]);

  const handleYearChange = (productId: number, basePrice: number, yearStr: string) => {
    const year = parseInt(yearStr);
    
    if (!year) {
      setSelections(prev => ({ ...prev, [productId]: 0 }));
      setPrices(prev => ({ ...prev, [productId]: basePrice }));
      return;
    }
    
    setSelections(prev => ({ ...prev, [productId]: year }));
    
    const newPrice = Math.round(basePrice * (yearMultiplier[year] || 1));
    setPrices(prev => ({ ...prev, [productId]: newPrice }));
    
    setAnimatingPrices(prev => ({ ...prev, [productId]: false }));
    setTimeout(() => {
      setAnimatingPrices(prev => ({ ...prev, [productId]: true }));
    }, 10);
  };

  const handleAddToCart = (product: Product) => {
    const year = selections[product.id];
    if (!year) {
      alert("Please select an age first");
      return;
    }

    const price = prices[product.id];
    
    setCart(prevCart => {
      const existingIdx = prevCart.findIndex(c => c.id === product.id && c.year === year);
      if (existingIdx >= 0) {
        const newCart = [...prevCart];
        newCart[existingIdx].qty++;
        return newCart;
      } else {
        return [...prevCart, { id: product.id, name: product.name, year, price, qty: 1 }];
      }
    });

    setIsCartOpen(true);
    setAddedFlags(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedFlags(prev => ({ ...prev, [product.id]: false }));
    }, 1200);
  };

  const changeQty = (idx: number, delta: number) => {
    setCart(prev => {
      const newCart = [...prev];
      newCart[idx].qty += delta;
      if (newCart[idx].qty <= 0) {
        newCart.splice(idx, 1);
      }
      return newCart;
    });
  };

  const removeFromCart = (idx: number) => {
    setCart(prev => {
      const newCart = [...prev];
      newCart.splice(idx, 1);
      return newCart;
    });
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const whatsappMsg = cart.map(c => `${c.name} (Age ${c.year}Y) x${c.qty} = ₹${(c.price*c.qty).toLocaleString('en-IN')}`).join('%0A');
  const whatsappUrl = `https://wa.me/919876543210?text=Hi%20Attirenest!%20Order:%0A${whatsappMsg}%0A%0ATotal:%20₹${totalCartPrice.toLocaleString('en-IN')}`;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-[420px] h-[420px] rounded-full blur-[90px] opacity-40" style={{background:'var(--blush)'}}></div>
          <div className="absolute top-20 -left-40 w-[360px] h-[360px] rounded-full blur-[80px] opacity-30" style={{background:'var(--sage)'}}></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full blur-[70px] opacity-25" style={{background:'var(--lav)'}}></div>
        </div>

        <div className="max-w-6xl mx-auto px-5 pt-12 pb-8 md:pt-20 md:pb-12">
          <div className="flex justify-center mb-6">
            <img src="/logo.jpg" alt="AttireNest By Kani" style={{width:'140px',height:'140px',borderRadius:'50%',objectFit:'cover',boxShadow:'0 8px 30px rgba(90,122,86,.2)'}} />
          </div>
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-xl border border-[#A8C3A5]/30 shadow-sm text-[11px] md:text-xs tracking-wider font-medium uppercase">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{background:'var(--sage)'}}></span>
              2026 Trends: Organic • Gender-Neutral • Pastel • Comfort-First
            </div>
          </div>
          
          <h1 className="text-center text-[56px] md:text-[88px] leading-[0.9] tracking-tight font-semibold">
            <span style={{background:'linear-gradient(92deg,#5A7A56 0%, #A8C3A5 35%, #F7C8D0 75%)',WebkitBackgroundClip:'text',backgroundClip:'text',color:'transparent'}}>Attirenest</span>
          </h1>
          <p className="text-center mt-3 text-lg md:text-xl text-[#5a6d57] font-medium tracking-wide">Comfort. Culture. Childhood.</p>
          
          <div className="max-w-2xl mx-auto mt-6 text-center">
            <p className="text-[15px] md:text-[17px] leading-relaxed text-[#4a4642]">Based in Tamil Nadu, Attirenest blends GOTS-certified organic cotton, gender-neutral designs, and Indian festive charm for ages 0–14.</p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <span className="px-3 py-1.5 rounded-full bg-[#A8C3A5]/20 text-xs font-medium text-[#3d5a39]">GOTS Certified</span>
              <span className="px-3 py-1.5 rounded-full bg-[#F7C8D0]/30 text-xs font-medium text-[#8a4b57]">Made in India</span>
              <span className="px-3 py-1.5 rounded-full bg-[#E6D9F0]/60 text-xs font-medium text-[#5d4a7a]">0-14 Years</span>
            </div>
          </div>
        </div>
      </header>

      {/* Sticky Nav */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-[#FFF9F5]/80 border-y border-[#A8C3A5]/15">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex items-center gap-2.5 py-3 overflow-x-auto no-scrollbar" id="category-tabs">
            {categories.map((cat) => (
              <a 
                key={cat.id} 
                href={`#${cat.id}`} 
                className={`cat-tab whitespace-nowrap px-4 py-2 rounded-full border border-[#A8C3A5]/30 text-sm font-medium hover:bg-white transition ${activeTab === cat.id ? 'tab-active' : ''}`}
              >
                {cat.name}
              </a>
            ))}
            <button 
              onClick={() => setIsCartOpen(true)} 
              className="ml-auto relative shrink-0 w-10 h-10 rounded-full bg-white border border-[#A8C3A5]/30 flex items-center justify-center hover:bg-[#A8C3A5]/10 transition" 
              title="Cart" 
              id="cart-button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
              {totalCartCount > 0 && (
                <span className="cart-badge">{totalCartCount}</span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-5 py-10 md:py-14" id="main-content">
        <div id="dynamic-categories">
          {categories.map((cat, index) => {
            const catProducts = products.filter(p => p.categoryId === cat.id);
            return (
              <section 
                key={cat.id} 
                id={cat.id} 
                data-cat 
                className={`scroll-mt-28 ${index > 0 ? 'mt-16' : ''}`}
                ref={el => {
                  sectionsRef.current[index] = el;
                }}
              >
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <h2 className="text-[28px] md:text-[36px] leading-tight">{cat.name}</h2>
                    <p className="text-sm text-[#6b6762] mt-1">{cat.description}</p>
                  </div>
                  <div className="hidden md:block w-20 h-[3px] rounded-full" style={{background:`linear-gradient(90deg,var(--${cat.theme || 'sage'}),transparent)`}}></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {catProducts.map(product => (
                    <article key={product.id} className="product bg-white rounded-[28px] p-3 md:p-4 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.15)]">
                      <div className="relative aspect-[4/5] rounded-[20px] overflow-hidden flex items-center justify-center bg-[#f5f5f5]">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover transition duration-500 hover:scale-105" 
                          loading="lazy" 
                        />
                        {product.ageRange && (
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-[11px] font-medium">{product.ageRange}</span>
                        )}
                        {product.badge && (
                          <span 
                            className="absolute bottom-3 right-3 px-2 py-1 rounded-full text-[10px] uppercase font-medium" 
                            style={{background: product.badgeBg || '#A8C3A5', color: product.badgeColor || '#fff'}}
                          >
                            {product.badge}
                          </span>
                        )}
                      </div>
                      <div className="pt-3.5">
                        <h3 className="font-semibold leading-snug">{product.name}</h3>
                        <p className="text-xs text-[#7a766f] mt-0.5">{product.features}</p>
                        <p className="text-[13px] text-[#5c5853] mt-1.5 line-clamp-1">{product.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <label className="text-[11px] text-[#7a766f]">Age:</label>
                          <select 
                            className="year-select" 
                            value={selections[product.id] || ''}
                            onChange={(e) => handleYearChange(product.id, product.basePrice, e.target.value)}
                            style={{ borderColor: (!selections[product.id] && false) ? '#F7C8D0' : '' }}
                          >
                            <option value="">Select</option>
                            {[1,2,3,4,5,6,7,8,9,10].map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`price-display ${animatingPrices[product.id] ? 'price-pop' : ''}`}>
                            ₹{(prices[product.id] || product.basePrice).toLocaleString('en-IN')}
                          </span>
                          <button className="add-cart-btn" onClick={() => handleAddToCart(product)}>
                            {addedFlags[product.id] ? '✅ Added!' : '🛒 Add'}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Design Tips */}
        <section className="mt-20">
          <div className="bg-white rounded-[32px] p-6 md:p-10 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.15)] border border-[#A8C3A5]/15">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{background:'linear-gradient(135deg,var(--sage),var(--blush))'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path d="M4 16l4-4 4 4 4-4 4 4M12 4v10"/></svg>
              </div>
              <div>
                <h3 className="text-[22px] md:text-[26px] leading-tight">How to shoot your catalogue</h3>
                <p className="text-sm text-[#6b6762] mt-1">India 2026 buyer expectations: clean, cultural, comforting</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="p-5 rounded-2xl bg-[#FFF9F5]">
                <h4 className="font-semibold text-[#3d5a39]">1. Flat-lay with culture</h4>
                <p className="text-[14px] leading-relaxed mt-2 text-[#5a554f]">Shoot on cream handloom muslin with marigold petals, small brass diya, or neem leaf – FirstCry-style clarity, but unmistakably Tamil festive warmth. Keep sage/blush palette visible.</p>
              </div>
              <div className="p-5 rounded-2xl bg-[#FFF9F5]">
                <h4 className="font-semibold text-[#8a4b57]">2. Studio comfort shots</h4>
                <p className="text-[14px] leading-relaxed mt-2 text-[#5a554f]">Like Gap Kids – real kids sitting cross-legged, twirling, hugging. Natural window light 10am–2pm. No stiff poses. Show stretch at waist & cuffs.</p>
              </div>
              <div className="p-5 rounded-2xl bg-[#FFF9F5]">
                <h4 className="font-semibold text-[#5d4a7a]">3. Consistent lighting</h4>
                <p className="text-[14px] leading-relaxed mt-2 text-[#5a554f]">Softbox 45° left, reflector right. White balance 5500K. Shoot entire collection same day to match pastel tones for Instagram grid & Amazon listings.</p>
              </div>
            </div>
            <p className="text-[12px] text-[#8a847d] mt-6">Tip for 2026: Add 3-second video of fabric scrunch test – parents in India now check “breathability” before price.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-[#A8C3A5]/20 bg-white/60 backdrop-blur">
        <div className="max-w-6xl mx-auto px-5 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="text-[24px] font-semibold" style={{fontFamily:"'Fraunces',serif"}}>Attirenest</div>
              <p className="text-sm text-[#6b6762] mt-1">Salem, Tamil Nadu • Small-batch organic kidswear</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <a href="https://wa.me/919876543210" className="px-4 py-2 rounded-full bg-[#25D366] text-white font-medium hover:opacity-90 transition">WhatsApp Order</a>
              <a href="https://instagram.com/attirenest.kids" className="px-4 py-2 rounded-full bg-[#2E2A27] text-white font-medium hover:opacity-90 transition">Instagram @attirenest.kids</a>
              <span className="px-4 py-2 rounded-full bg-[#A8C3A5]/20 text-[#3d5a39]">hello@attirenest.in</span>
            </div>
          </div>
          <div className="text-center text-[12px] text-[#9a938c] mt-8">© 2026 Attirenest. GOTS-certified organic cotton. Designed for Indian childhoods.</div>
        </div>
      </footer>

      {/* Cart Overlay */}
      <div 
        className={`cart-overlay ${isCartOpen ? 'open' : ''}`} 
        onClick={() => setIsCartOpen(false)}
      ></div>

      {/* Cart Panel */}
      <div className={`cart-panel ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h3 style={{fontFamily:"'Fraunces',serif", fontSize:'20px', margin:0}}>🛒 Your Cart</h3>
          <button onClick={() => setIsCartOpen(false)} style={{background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:'#2E2A27'}}>&times;</button>
        </div>
        
        <div className="cart-body">
          {cart.length === 0 ? (
            <p style={{textAlign:'center', color:'#9a938c', marginTop:'40px'}}>
              Your cart is empty.<br/>
              <span style={{fontSize:'13px'}}>Select an age and add items!</span>
            </p>
          ) : (
            cart.map((item, i) => (
              <div key={`${item.id}-${item.year}`} className="cart-item">
                <div style={{flex:1}}>
                  <div style={{fontWeight:600, fontSize:'14px'}}>{item.name}</div>
                  <div style={{fontSize:'12px', color:'#7a766f', marginTop:'2px'}}>Age: {item.year}Y &middot; ₹{item.price.toLocaleString('en-IN')}</div>
                  <div style={{display:'flex', alignItems:'center', gap:'8px', marginTop:'6px'}}>
                    <button onClick={() => changeQty(i, -1)} style={{width:'24px', height:'24px', borderRadius:'6px', border:'1px solid #ddd', background:'#fff', cursor:'pointer', fontSize:'14px'}}>-</button>
                    <span style={{fontSize:'13px', fontWeight:600}}>{item.qty}</span>
                    <button onClick={() => changeQty(i, 1)} style={{width:'24px', height:'24px', borderRadius:'6px', border:'1px solid #ddd', background:'#fff', cursor:'pointer', fontSize:'14px'}}>+</button>
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontWeight:700, fontSize:'15px'}}>₹{(item.price * item.qty).toLocaleString('en-IN')}</div>
                  <button onClick={() => removeFromCart(i)} style={{background:'none', border:'none', color:'#d44', fontSize:'11px', cursor:'pointer', marginTop:'4px'}}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
              <span style={{fontSize:'14px', color:'#6b6762'}}>Total</span>
              <span style={{fontSize:'22px', fontWeight:700, color:'#2E2A27'}}>₹{totalCartPrice.toLocaleString('en-IN')}</span>
            </div>
            <a 
              href={whatsappUrl} 
              target="_blank" 
              rel="noreferrer"
              style={{display:'block', textAlign:'center', background:'#25D366', color:'white', padding:'12px', borderRadius:'16px', fontWeight:600, textDecoration:'none', fontSize:'14px', transition:'opacity .2s'}}
            >
              📩 Order via WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
