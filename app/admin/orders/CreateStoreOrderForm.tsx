'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Store,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Printer,
  MessageSquare,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  UserCheck,
  Send,
  Truck,
} from 'lucide-react';
import { createInStoreOrderAction, InStoreOrderItemInput } from '../actions';
import { OrderReceiptModal, ReceiptData } from '../components/OrderReceiptModal';

export interface StoreProductVariant {
  year: string;
  price: number;
  stock: number;
}

export interface StoreProduct {
  id: number;
  name: string;
  categoryId: string;
  basePrice: number;
  image?: string;
  variants: StoreProductVariant[];
}

export interface StoreCategory {
  id: string;
  name: string;
}

interface CreateStoreOrderFormProps {
  products: StoreProduct[];
  categories: StoreCategory[];
}

interface CartItem {
  productId: number;
  name: string;
  image?: string;
  year: string;
  price: number;
  qty: number;
  maxStock: number;
}

export function CreateStoreOrderForm({ products, categories }: CreateStoreOrderFormProps) {
  // Navigation & Product Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Currently selected product for quick-add modal/drawer
  const [activeProduct, setActiveProduct] = useState<StoreProduct | null>(null);
  const [selectedVariantYear, setSelectedVariantYear] = useState<string>('');
  const [selectedVariantQty, setSelectedVariantQty] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<number>(0);

  // Cart / Bill items
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Customer Information
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [sendEmailNotification, setSendEmailNotification] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState<'takeaway' | 'delivery'>('takeaway');

  // Delivery Address (if home delivery)
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('');

  // Auto-lookup hint
  const [lookupResult, setLookupResult] = useState<{
    fullName?: string;
    email?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Payment details
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'other'>('cash');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [paymentId, setPaymentId] = useState('');
  const [notes, setNotes] = useState('');

  // Processing & Confirmation
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [completedReceipt, setCompletedReceipt] = useState<ReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        p.name.toLowerCase().includes(q) ||
        p.id.toString() === q;

      const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Open product selector dialog
  const handleSelectProduct = (product: StoreProduct) => {
    setActiveProduct(product);
    // Find first variant with stock > 0, or default to first
    const inStockVariant = product.variants.find((v) => v.stock > 0) || product.variants[0];
    if (inStockVariant) {
      setSelectedVariantYear(inStockVariant.year);
      setCustomPrice(inStockVariant.price);
      setSelectedVariantQty(1);
    }
  };

  // Change selected variant
  const handleVariantChange = (year: string) => {
    setSelectedVariantYear(year);
    if (!activeProduct) return;
    const variant = activeProduct.variants.find((v) => v.year === year);
    if (variant) {
      setCustomPrice(variant.price);
      setSelectedVariantQty(1);
    }
  };

  // Add item from dialog to cart
  const handleAddToCart = () => {
    if (!activeProduct || !selectedVariantYear) return;
    const variant = activeProduct.variants.find((v) => v.year === selectedVariantYear);
    if (!variant) return;

    if (variant.stock <= 0) {
      alert('This size variant is currently out of stock!');
      return;
    }

    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.productId === activeProduct.id && item.year === selectedVariantYear
      );

      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        const newQty = Math.min(existing.qty + selectedVariantQty, variant.stock);
        const updated = [...prev];
        updated[existingIdx] = {
          ...existing,
          qty: newQty,
          price: customPrice,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: activeProduct.id,
            name: activeProduct.name,
            image: activeProduct.image,
            year: selectedVariantYear,
            price: customPrice,
            qty: Math.min(selectedVariantQty, variant.stock),
            maxStock: variant.stock,
          },
        ];
      }
    });

    setActiveProduct(null);
  };

  // Cart quantity adjustments
  const handleUpdateQty = (index: number, delta: number) => {
    setCartItems((prev) => {
      const item = prev[index];
      const newQty = item.qty + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      if (newQty > item.maxStock) {
        alert(`Only ${item.maxStock} pieces available in stock for ${item.name} (${item.year})`);
        return prev;
      }
      const updated = [...prev];
      updated[index] = { ...item, qty: newQty };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Financial Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cartItems]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - (discountAmount || 0));
  }, [subtotal, discountAmount]);

  // Phone lookup
  const handlePhoneChange = async (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    setCustomerPhone(cleaned);

    if (cleaned.length === 10) {
      setIsLookingUp(true);
      try {
        const res = await fetch(`/api/customer/lookup?phone=${cleaned}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.address) {
            setLookupResult(data.address);
          } else {
            setLookupResult(null);
          }
        }
      } catch (err) {
        console.error('Customer lookup error:', err);
      } finally {
        setIsLookingUp(false);
      }
    } else {
      setLookupResult(null);
    }
  };

  const handleApplyLookup = () => {
    if (!lookupResult) return;
    if (lookupResult.fullName) setCustomerName(lookupResult.fullName);
    if (lookupResult.email) {
      setCustomerEmail(lookupResult.email);
      setSendEmailNotification(true);
    }
    if (lookupResult.addressLine1) {
      setAddressLine1(lookupResult.addressLine1);
      setFulfillmentType('delivery');
    }
    if (lookupResult.city) setCity(lookupResult.city);
    if (lookupResult.state) setState(lookupResult.state);
    if (lookupResult.pincode) setPincode(lookupResult.pincode);
    setLookupResult(null);
  };

  // Reset form for next order
  const handleResetForm = () => {
    setCartItems([]);
    setDiscountAmount(0);
    setCustomerName('Walk-in Customer');
    setCustomerPhone('');
    setCustomerEmail('');
    setSendEmailNotification(false);
    setFulfillmentType('takeaway');
    setAddressLine1('');
    setAddressLine2('');
    setCity('Bangalore');
    setState('Karnataka');
    setPincode('');
    setPaymentMethod('cash');
    setPaymentStatus('paid');
    setPaymentId('');
    setNotes('');
    setFormError(null);
    setCompletedReceipt(null);
  };

  // Handle Form Submit
  const handleCompleteOrder = () => {
    setFormError(null);

    if (cartItems.length === 0) {
      setFormError('Please add at least one item to the order before completing.');
      return;
    }

    if (fulfillmentType === 'delivery' && !addressLine1.trim()) {
      setFormError('Please enter the delivery address line 1.');
      return;
    }

    startTransition(async () => {
      const itemsPayload: InStoreOrderItemInput[] = cartItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        year: item.year,
        price: item.price,
        qty: item.qty,
      }));

      const res = await createInStoreOrderAction({
        customerName,
        customerPhone,
        customerEmail,
        fulfillmentType,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        items: itemsPayload,
        paymentMethod,
        paymentStatus,
        paymentId,
        notes,
        sendEmailNotification: sendEmailNotification && !!customerEmail,
      });

      if (res.error) {
        setFormError(res.error);
        return;
      }

      if (res.success && res.orderNumber) {
        const receipt: ReceiptData = {
          orderNumber: res.orderNumber,
          orderId: res.orderId,
          orderType: 'in_store',
          createdAt: new Date().toISOString(),
          amount: grandTotal,
          paymentMethod,
          paymentId: paymentId || (paymentMethod === 'cash' ? 'CASH' : `STORE-${paymentMethod.toUpperCase()}`),
          customerName,
          customerPhone,
          customerEmail,
          addressLine1,
          city,
          notes,
          items: cartItems.map((c) => ({
            name: c.name,
            year: c.year,
            price: c.price,
            qty: c.qty,
          })),
        };

        setCompletedReceipt(receipt);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="w-10 h-10 rounded-2xl bg-[#FAF7F2] hover:bg-[#E8E2D9] border border-[#E8E2D9] flex items-center justify-center text-[#5C564E] transition"
            title="Back to Orders"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold uppercase tracking-wider">
                <Store size={10} /> Store POS
              </span>
              <span className="text-xs text-[#7A7367]">AttireNest Bangalore</span>
            </div>
            <h1 className="text-xl font-extrabold text-[#2E2A27]" style={{ fontFamily: "'Fraunces', serif" }}>
              New In-Store Order
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cartItems.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear this order?')) {
                  handleResetForm();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-red-50 hover:text-red-600 text-xs font-semibold text-[#5C564E] transition cursor-pointer"
            >
              <RotateCcw size={14} /> Clear Cart
            </button>
          )}
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-white border border-[#DCD6CC] hover:bg-[#FAF7F2] text-xs font-semibold text-[#4A443B] transition"
          >
            View All Orders
          </Link>
        </div>
      </div>

      {/* Success Order Confirmation Banner */}
      {completedReceipt && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 sm:p-7 rounded-3xl shadow-lg animate-in zoom-in-95 duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <CheckCircle2 size={28} className="text-white" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/25 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Order Successfully Created & Stock Deducted
                </span>
                <h3 className="text-2xl font-black">
                  Order #{completedReceipt.orderNumber}
                </h3>
                <p className="text-xs text-emerald-100 mt-1">
                  Total Paid: <strong className="text-white">₹{completedReceipt.amount.toLocaleString('en-IN')}</strong> • Customer: <strong>{completedReceipt.customerName}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setShowReceiptModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white text-[#2E2A27] text-xs font-bold hover:bg-emerald-50 transition shadow-xs cursor-pointer"
              >
                <Printer size={15} className="text-[#5A7A56]" /> View & Print Receipt
              </button>

              {completedReceipt.customerPhone && (
                <a
                  href={`https://wa.me/91${completedReceipt.customerPhone}?text=${encodeURIComponent(
                    `Hi ${completedReceipt.customerName}, thank you for shopping at AttireNest Store Bangalore! Your order ${completedReceipt.orderNumber} for ₹${completedReceipt.amount.toLocaleString(
                      'en-IN'
                    )} has been successfully recorded. We look forward to seeing you again! ✨`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-800/80 hover:bg-emerald-900 text-white text-xs font-bold transition shadow-xs"
                >
                  <MessageSquare size={14} /> Send WhatsApp Bill
                </a>
              )}

              <button
                onClick={handleResetForm}
                className="inline-flex items-center gap-1 px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition cursor-pointer"
              >
                <Plus size={15} /> Next In-Store Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Error Message */}
      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span>{formError}</span>
        </div>
      )}

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Selection & Catalog (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Catalog Search & Category Filters */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-4">
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8479]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name or product ID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#DCD6CC] text-xs font-medium text-[#2E2A27] focus:outline-none focus:border-[#5A7A56] transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#8C8479] hover:text-[#2E2A27]"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#5A7A56] text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-[#5C564E] hover:bg-[#E8E2D9]'
                }`}
              >
                All Products
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                    selectedCategory === c.id
                      ? 'bg-[#5A7A56] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-[#5C564E] hover:bg-[#E8E2D9]'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full bg-white rounded-3xl border border-[#E8E2D9] p-10 text-center text-[#8C8479]">
                <ShoppingBag size={28} className="mx-auto text-[#A39B8F] mb-2" />
                <p className="font-semibold text-[#2E2A27]">No items found</p>
                <p className="text-xs text-[#8C8479] mt-1">Try another search term or category.</p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
                const isOutOfStock = totalStock <= 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && handleSelectProduct(p)}
                    className={`bg-white rounded-2xl border border-[#E8E2D9] p-3 flex flex-col justify-between transition-all group ${
                      isOutOfStock
                        ? 'opacity-60 cursor-not-allowed'
                        : 'cursor-pointer hover:border-[#5A7A56] hover:shadow-md hover:scale-[1.01]'
                    }`}
                  >
                    <div>
                      {/* Thumbnail */}
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#E8E2D9]/70 mb-2.5">
                        {p.image ? (
                          <Image
                            src={p.image}
                            alt={p.name}
                            fill
                            sizes="(max-width: 640px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#8C8479] text-xs">
                            No Photo
                          </div>
                        )}
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white">
                          #{p.id}
                        </span>
                      </div>

                      {/* Info */}
                      <h4 className="font-bold text-xs text-[#2E2A27] line-clamp-1 group-hover:text-[#5A7A56] transition-colors">
                        {p.name}
                      </h4>
                      <p className="text-xs font-extrabold text-[#5A7A56] mt-0.5">
                        ₹{p.basePrice.toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#E8E2D9]/60 flex items-center justify-between text-[10px]">
                      <span
                        className={`font-semibold ${
                          totalStock > 3
                            ? 'text-emerald-700'
                            : totalStock > 0
                            ? 'text-amber-700'
                            : 'text-red-600'
                        }`}
                      >
                        {totalStock > 0 ? `${totalStock} in stock` : 'Out of Stock'}
                      </span>
                      <span className="w-6 h-6 rounded-lg bg-[#FAF7F2] group-hover:bg-[#5A7A56] group-hover:text-white flex items-center justify-center text-[#5A7A56] font-bold transition">
                        +
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Order Bill / Cart Summary & Checkout (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Bill Items Card */}
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#5A7A56]" />
                <h3 className="font-bold text-base text-[#2E2A27]">
                  Order Items ({cartItems.reduce((sum, i) => sum + i.qty, 0)})
                </h3>
              </div>
              <span className="text-xs font-bold text-[#8C8479]">Store Counter Bill</span>
            </div>

            {/* Cart Items List */}
            {cartItems.length === 0 ? (
              <div className="py-8 text-center text-[#8C8479] space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#FAF7F2] flex items-center justify-center mx-auto text-[#A39B8F]">
                  <ShoppingBag size={20} />
                </div>
                <p className="text-xs font-semibold text-[#4A443B]">No items selected yet</p>
                <p className="text-[11px] text-[#8C8479]">
                  Click on any product from the catalog on the left to add it to this bill.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {cartItems.map((item, index) => (
                  <div
                    key={`${item.productId}-${item.year}`}
                    className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.image && (
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white shrink-0 border border-[#DCD6CC]">
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-[#2E2A27] truncate">{item.name}</div>
                        <div className="text-[11px] text-[#7A7367] flex items-center gap-2 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-white font-semibold text-[#5A7A56] border border-[#E8E2D9]">
                            {item.year}
                          </span>
                          <span>@ ₹{item.price}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Quantity Stepper */}
                      <div className="flex items-center bg-white rounded-xl border border-[#DCD6CC] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(index, -1)}
                          className="px-2 py-1 text-[#5C564E] hover:bg-[#FAF7F2] transition cursor-pointer"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="px-2 font-bold text-xs text-[#2E2A27]">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(index, 1)}
                          className="px-2 py-1 text-[#5C564E] hover:bg-[#FAF7F2] transition cursor-pointer"
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      <div className="font-extrabold text-[#2E2A27] text-right min-w-[50px]">
                        ₹{(item.price * item.qty).toLocaleString('en-IN')}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Subtotal, Discount & Grand Total */}
            <div className="pt-3 border-t border-[#E8E2D9] space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#7A7367]">
                <span>Items Subtotal</span>
                <span className="font-bold text-[#2E2A27]">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {/* Special Store Discount Input */}
              <div className="flex items-center justify-between text-[#7A7367]">
                <span>Store Discount (₹)</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-24 px-2 py-1 text-right rounded-lg bg-[#FAF7F2] border border-[#DCD6CC] text-xs font-bold text-[#2E2A27] focus:outline-none focus:border-[#5A7A56]"
                />
              </div>

              <div className="pt-2 border-t border-[#E8E2D9] flex items-center justify-between text-base">
                <span className="font-extrabold text-[#2E2A27]">Grand Total</span>
                <span className="text-xl font-black text-[#5A7A56]">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Details Card */}
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="font-bold text-sm text-[#2E2A27] uppercase tracking-wider">
              Customer Information
            </h3>

            {/* Phone & Auto-Lookup */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-[#5C564E] mb-1">
                <label>Mobile Number</label>
                {isLookingUp && <span className="text-[10px] text-[#5A7A56]">Checking customer...</span>}
              </div>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="10-digit mobile number..."
                maxLength={10}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#DCD6CC] text-xs font-medium text-[#2E2A27] focus:outline-none focus:border-[#5A7A56]"
              />

              {/* Found Customer Autofill Alert */}
              {lookupResult && (
                <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <UserCheck size={14} className="shrink-0 text-emerald-600" />
                    <span className="truncate">
                      Found: <strong>{lookupResult.fullName || 'Previous Buyer'}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyLookup}
                    className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                  >
                    Autofill
                  </button>
                </div>
              )}
            </div>

            {/* Customer Full Name */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-[#5C564E] mb-1">
                <label>Customer Name</label>
                <button
                  type="button"
                  onClick={() => setCustomerName('Walk-in Customer')}
                  className="text-[10px] text-[#5A7A56] hover:underline"
                >
                  Set as Walk-in
                </button>
              </div>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#DCD6CC] text-xs font-medium text-[#2E2A27] focus:outline-none focus:border-[#5A7A56]"
              />
            </div>

            {/* Customer Email & Receipt Checkbox */}
            <div>
              <label className="block text-xs font-semibold text-[#5C564E] mb-1">
                Customer Email <span className="text-[#8C8479] font-normal">(Optional)</span>
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => {
                  setCustomerEmail(e.target.value);
                  if (e.target.value && !sendEmailNotification) {
                    setSendEmailNotification(true);
                  }
                }}
                placeholder="customer@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#DCD6CC] text-xs font-medium text-[#2E2A27] focus:outline-none focus:border-[#5A7A56]"
              />

              {customerEmail && (
                <label className="flex items-center gap-2 mt-2 text-xs text-[#5C564E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmailNotification}
                    onChange={(e) => setSendEmailNotification(e.target.checked)}
                    className="rounded text-[#5A7A56] focus:ring-[#5A7A56]"
                  />
                  <span>Send order confirmation & receipt to this email</span>
                </label>
              )}
            </div>

            {/* Fulfillment Type: Takeaway vs Delivery */}
            <div>
              <label className="block text-xs font-semibold text-[#5C564E] mb-1.5">
                Fulfillment Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFulfillmentType('takeaway')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                    fulfillmentType === 'takeaway'
                      ? 'bg-[#5A7A56] text-white border-[#5A7A56] shadow-xs'
                      : 'bg-[#FAF7F2] text-[#5C564E] border-[#DCD6CC] hover:bg-[#E8E2D9]'
                  }`}
                >
                  <Store size={14} /> Store Takeaway
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillmentType('delivery')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                    fulfillmentType === 'delivery'
                      ? 'bg-[#5A7A56] text-white border-[#5A7A56] shadow-xs'
                      : 'bg-[#FAF7F2] text-[#5C564E] border-[#DCD6CC] hover:bg-[#E8E2D9]'
                  }`}
                >
                  <Truck size={14} /> Home Delivery
                </button>
              </div>

              {/* Delivery Address fields if Delivery selected */}
              {fulfillmentType === 'delivery' && (
                <div className="mt-3 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] space-y-2.5 animate-in slide-in-from-top-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5C564E] mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="House / Flat / Street..."
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#DCD6CC] text-xs font-medium text-[#2E2A27]"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#5C564E] mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#DCD6CC] text-xs font-medium text-[#2E2A27]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#5C564E] mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="State"
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#DCD6CC] text-xs font-medium text-[#2E2A27]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#5C564E] mb-1">
                        Pincode
                      </label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="560001"
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#DCD6CC] text-xs font-medium text-[#2E2A27]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment & Settlement Card */}
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="font-bold text-sm text-[#2E2A27] uppercase tracking-wider">
              Payment Method & Status
            </h3>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-500 font-bold shadow-xs'
                    : 'bg-[#FAF7F2] text-[#5C564E] border-[#DCD6CC] hover:bg-[#E8E2D9]'
                }`}
              >
                <Banknote size={18} />
                <span className="text-xs">Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition cursor-pointer ${
                  paymentMethod === 'upi'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-500 font-bold shadow-xs'
                    : 'bg-[#FAF7F2] text-[#5C564E] border-[#DCD6CC] hover:bg-[#E8E2D9]'
                }`}
              >
                <Smartphone size={18} />
                <span className="text-xs">UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-500 font-bold shadow-xs'
                    : 'bg-[#FAF7F2] text-[#5C564E] border-[#DCD6CC] hover:bg-[#E8E2D9]'
                }`}
              >
                <CreditCard size={18} />
                <span className="text-xs">Card / POS</span>
              </button>
            </div>

            {/* Payment Status (Paid vs Pending) */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="font-semibold text-[#5C564E]">Payment Settlement</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('paid')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                    paymentStatus === 'paid'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#FAF7F2] text-[#5C564E]'
                  }`}
                >
                  ✓ Paid Full
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus('pending')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                    paymentStatus === 'pending'
                      ? 'bg-amber-500 text-white'
                      : 'bg-[#FAF7F2] text-[#5C564E]'
                  }`}
                >
                  ⏳ Pending
                </button>
              </div>
            </div>

            {/* Reference ID / Note */}
            <div>
              <label className="block text-xs font-semibold text-[#5C564E] mb-1">
                Transaction Ref / Note <span className="text-[#8C8479] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                placeholder={paymentMethod === 'upi' ? 'UPI UTR / Ref Number...' : 'Cash slip / Card auth code...'}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#DCD6CC] text-xs font-medium text-[#2E2A27] focus:outline-none focus:border-[#5A7A56]"
              />
            </div>

            {/* Staff Internal Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#5C564E] mb-1">
                Order Remarks / Internal Notes <span className="text-[#8C8479] font-normal">(Optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Gift wrapped, Size exchange, Counter pickup..."
                rows={2}
                className="w-full px-3.5 py-2 rounded-2xl bg-[#FAF7F2] border border-[#DCD6CC] text-xs font-medium text-[#2E2A27] focus:outline-none focus:border-[#5A7A56] resize-none"
              />
            </div>
          </div>

          {/* Action Submit Button */}
          <button
            type="button"
            disabled={isPending || cartItems.length === 0}
            onClick={handleCompleteOrder}
            className={`w-full py-4 rounded-3xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              cartItems.length === 0 || isPending
                ? 'bg-[#A39B8F] text-white/80 cursor-not-allowed shadow-none'
                : 'bg-[#5A7A56] hover:bg-[#486345] text-white shadow-[#5A7A56]/30 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
            }`}
          >
            {isPending ? (
              <span>Saving Order & Deducting Stock...</span>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>Complete In-Store Order (₹{grandTotal.toLocaleString('en-IN')})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Product Variant Quick-Select Dialog Modal */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8E2D9] space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {activeProduct.image && (
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#E8E2D9] shrink-0">
                    <Image src={activeProduct.image} alt={activeProduct.name} fill className="object-cover" />
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-base text-[#2E2A27] leading-tight">
                    {activeProduct.name}
                  </h3>
                  <p className="text-xs text-[#7A7367]">Choose age/size variant</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveProduct(null)}
                className="p-1 rounded-xl text-[#7A7367] hover:bg-[#FAF7F2] hover:text-[#2E2A27]"
              >
                ✕
              </button>
            </div>

            {/* Size Variant Chips */}
            <div>
              <label className="block text-xs font-bold text-[#5C564E] uppercase tracking-wider mb-2">
                Available Sizes & Stock
              </label>
              <div className="grid grid-cols-2 gap-2">
                {activeProduct.variants.map((v) => {
                  const isSelected = selectedVariantYear === v.year;
                  const isOutOfStock = v.stock <= 0;

                  return (
                    <button
                      type="button"
                      key={v.year}
                      disabled={isOutOfStock}
                      onClick={() => handleVariantChange(v.year)}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                        isOutOfStock
                          ? 'opacity-40 bg-[#FAF7F2] border-[#E8E2D9] cursor-not-allowed'
                          : isSelected
                          ? 'bg-[#5A7A56] text-white border-[#5A7A56] shadow-xs cursor-pointer'
                          : 'bg-[#FAF7F2] text-[#2E2A27] border-[#DCD6CC] hover:bg-[#E8E2D9] cursor-pointer'
                      }`}
                    >
                      <div className="font-bold text-xs">{v.year}</div>
                      <div
                        className={`text-[11px] font-semibold mt-1 ${
                          isSelected ? 'text-emerald-100' : 'text-[#5A7A56]'
                        }`}
                      >
                        ₹{v.price.toLocaleString('en-IN')}
                      </div>
                      <div
                        className={`text-[10px] mt-0.5 ${
                          isSelected
                            ? 'text-white/80'
                            : v.stock <= 2
                            ? 'text-amber-700 font-bold'
                            : 'text-[#7A7367]'
                        }`}
                      >
                        {isOutOfStock ? '0 in stock' : `${v.stock} in stock`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price and Quantity */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E8E2D9]">
              <div>
                <label className="block text-[11px] font-semibold text-[#5C564E] mb-1">
                  Unit Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#DCD6CC] text-xs font-bold text-[#2E2A27]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5C564E] mb-1">
                  Quantity
                </label>
                <div className="flex items-center bg-[#FAF7F2] rounded-xl border border-[#DCD6CC]">
                  <button
                    type="button"
                    onClick={() => setSelectedVariantQty(Math.max(1, selectedVariantQty - 1))}
                    className="px-3 py-2 text-[#5C564E] hover:bg-[#E8E2D9] rounded-l-xl transition"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="flex-1 text-center font-bold text-xs text-[#2E2A27]">
                    {selectedVariantQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const v = activeProduct.variants.find((v) => v.year === selectedVariantYear);
                      if (v && selectedVariantQty < v.stock) {
                        setSelectedVariantQty(selectedVariantQty + 1);
                      }
                    }}
                    className="px-3 py-2 text-[#5C564E] hover:bg-[#E8E2D9] rounded-r-xl transition"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Total for this selection */}
            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-[#7A7367]">Item Total</span>
              <span className="font-extrabold text-sm text-[#2E2A27]">
                ₹{(customPrice * selectedVariantQty).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveProduct(null)}
                className="flex-1 py-2.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#E8E2D9] text-xs font-bold text-[#5C564E] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-2 py-2.5 rounded-2xl bg-[#5A7A56] hover:bg-[#486345] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                + Add to Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {showReceiptModal && completedReceipt && (
        <OrderReceiptModal
          receipt={completedReceipt}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
}
