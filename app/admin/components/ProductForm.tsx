'use client';

import { useActionState, useRef, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addProductAction, updateProductAction, ActionResponse } from '../actions';
import {
  UploadCloud,
  Trash2,
  Plus,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
} from 'lucide-react';

export interface CategoryOption {
  id: string;
  name: string;
}

export interface VariantData {
  year: string;
  price: number;
  stock: number;
}

export interface ProductFormData {
  id?: number;
  categoryId: string;
  name: string;
  features: string;
  description: string;
  basePrice: number;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  images: string[];
  variants?: VariantData[];
}

interface ProductFormProps {
  categories: CategoryOption[];
  initialData?: ProductFormData;
  isEditing?: boolean;
}

interface FilePreview {
  id: string;
  file: File;
  url: string;
}

const BADGE_PRESETS = [
  { label: 'Organic (Sage)', bg: '#5A7A56', color: '#ffffff' },
  { label: 'Popular (Amber)', bg: '#D97706', color: '#ffffff' },
  { label: 'New (Teal)', bg: '#0D9488', color: '#ffffff' },
  { label: 'Sale (Rose)', bg: '#E11D48', color: '#ffffff' },
  { label: 'Classic (Charcoal)', bg: '#2E2A27', color: '#ffffff' },
];

const VARIANT_PRESETS = [
  { label: 'Toddlers (1-4Y)', variants: [{ year: '1-2Y', price: 0, stock: 5 }, { year: '2-3Y', price: 0, stock: 5 }, { year: '3-4Y', price: 0, stock: 5 }] },
  { label: 'Kids (5-8Y)', variants: [{ year: '5-6Y', price: 0, stock: 5 }, { year: '6-7Y', price: 0, stock: 5 }, { year: '7-8Y', price: 0, stock: 5 }] },
  { label: 'Babies (0-12M)', variants: [{ year: '0-3M', price: 0, stock: 5 }, { year: '3-6M', price: 0, stock: 5 }, { year: '6-12M', price: 0, stock: 5 }] },
];

export function ProductForm({ categories, initialData, isEditing = false }: ProductFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const action = isEditing ? updateProductAction : addProductAction;
  const [state, formAction] = useActionState(action, null as ActionResponse | null);
  const [isPendingLocal, startTransition] = useTransition();

  // Local Form State for Live Preview
  const [name, setName] = useState(initialData?.name || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || categories[0]?.id || '');
  const [features, setFeatures] = useState(initialData?.features || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [basePrice, setBasePrice] = useState<number | string>(initialData?.basePrice || '');
  const [badge, setBadge] = useState(initialData?.badge || '');
  const [badgeBg, setBadgeBg] = useState(initialData?.badgeBg || '#5A7A56');
  const [badgeColor, setBadgeColor] = useState(initialData?.badgeColor || '#ffffff');

  const [variants, setVariants] = useState<VariantData[]>(initialData?.variants || []);
  const [existingImages, setExistingImages] = useState<string[]>(initialData?.images || []);
  const [newFiles, setNewFiles] = useState<FilePreview[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB
  const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20MB

  useEffect(() => {
    if (state?.success) {
      // If added or updated successfully, navigate back to product list after a brief delay
      const timer = setTimeout(() => {
        router.push('/admin/products');
        router.refresh();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  // Variant Helpers
  const addVariant = (preset?: VariantData) => {
    const defaultPrice = Number(basePrice) || 0;
    setVariants((prev) => [
      ...prev,
      preset ? { ...preset, price: preset.price || defaultPrice } : { year: '', price: defaultPrice, stock: 5 },
    ]);
  };

  const applyVariantPreset = (presetVariants: VariantData[]) => {
    const defaultPrice = Number(basePrice) || 0;
    const existingYears = new Set(variants.map((v) => v.year));
    const toAdd = presetVariants
      .filter((pv) => !existingYears.has(pv.year))
      .map((pv) => ({ ...pv, price: defaultPrice }));
    setVariants((prev) => [...prev, ...toAdd]);
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof VariantData, value: string) => {
    if (field === 'year') {
      setVariants((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], year: value };
        return next;
      });
      return;
    }
    const numVal = value === '' ? 0 : Number(value);
    setVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: isNaN(numVal) ? 0 : numVal };
      return next;
    });
  };

  // Image Upload Handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    const files = Array.from(e.target.files || []);

    const oversizedFiles = files.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setLocalError(
        `File too large (Max 4.5MB): ${oversizedFiles.map((f) => f.name).join(', ')}`
      );
      e.target.value = '';
      return;
    }

    const currentTotal = newFiles.reduce((acc, curr) => acc + curr.file.size, 0);
    const incomingTotal = files.reduce((acc, curr) => acc + curr.size, 0);
    if (currentTotal + incomingTotal > MAX_TOTAL_SIZE) {
      setLocalError('Total upload size exceeds 20MB limit. Please upload fewer images.');
      e.target.value = '';
      return;
    }

    const newPreviews = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      url: URL.createObjectURL(file),
    }));
    setNewFiles((prev) => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewFile = (id: string) => {
    setNewFiles((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleFormAction = (formData: FormData) => {
    setLocalError(null);

    const totalImages = existingImages.length + newFiles.length;
    if (totalImages === 0) {
      setLocalError('Please upload at least one image for the product.');
      return;
    }

    formData.delete('images');
    newFiles.forEach((fp) => {
      formData.append('images', fp.file);
    });
    formData.set('existingImages', JSON.stringify(existingImages));
    formData.set('variantsJson', JSON.stringify(variants));

    startTransition(() => {
      formAction(formData);
    });
  };

  const allPreviewImages = [
    ...existingImages,
    ...newFiles.map((f) => f.url),
  ];
  const primaryThumbnail = allPreviewImages[0] || '';

  return (
    <form action={handleFormAction} ref={formRef} className="space-y-8">
      {isEditing && <input type="hidden" name="id" value={initialData?.id} />}

      {/* Top Notification Alerts */}
      {localError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          <span>{localError}</span>
        </div>
      )}
      {state?.error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          <span>{state.error}</span>
        </div>
      )}
      {state?.success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-3">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <span>{state.success} Redirecting to products list...</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Basic Information */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D9] shadow-xs space-y-5">
            <h2
              className="text-xl font-bold text-[#2E2A27] flex items-center gap-2"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              General Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#5C564E] uppercase tracking-wider mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g., Cloud Cotton Romper"
                  className="w-full px-4 py-3 rounded-2xl border border-[#DCD6CC] bg-[#FAF7F2]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A7A56]/40 focus:border-[#5A7A56] transition text-sm text-[#2E2A27]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5C564E] uppercase tracking-wider mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="categoryId"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-[#DCD6CC] bg-[#FAF7F2]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A7A56]/40 focus:border-[#5A7A56] transition text-sm text-[#2E2A27] cursor-pointer"
                >
                  <option value="">Select a Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5C564E] uppercase tracking-wider mb-2">
                  Default Base Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="basePrice"
                  min="1"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  required
                  placeholder="e.g., 699"
                  className="w-full px-4 py-3 rounded-2xl border border-[#DCD6CC] bg-[#FAF7F2]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A7A56]/40 focus:border-[#5A7A56] transition text-sm text-[#2E2A27]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#5C564E] uppercase tracking-wider mb-2">
                  Key Features / Tagline <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="features"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  required
                  placeholder="e.g., 100% GOTS organic cotton • breathable weave"
                  className="w-full px-4 py-3 rounded-2xl border border-[#DCD6CC] bg-[#FAF7F2]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A7A56]/40 focus:border-[#5A7A56] transition text-sm text-[#2E2A27]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#5C564E] uppercase tracking-wider mb-2">
                  Full Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Detailed product story, fabric care instructions, fit guidance, etc."
                  className="w-full px-4 py-3 rounded-2xl border border-[#DCD6CC] bg-[#FAF7F2]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A7A56]/40 focus:border-[#5A7A56] transition text-sm text-[#2E2A27] resize-y"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Age Variants & Stock Management */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D9] shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E2D9]">
              <div>
                <h2
                  className="text-xl font-bold text-[#2E2A27]"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  Age & Size Variants
                </h2>
                <p className="text-xs text-[#7A7367] mt-0.5">
                  Set prices and stock limits for each age size option.
                </p>
              </div>

              <button
                type="button"
                onClick={() => addVariant()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5A7A56]/15 text-[#5A7A56] hover:bg-[#5A7A56] hover:text-white font-semibold text-xs transition duration-200"
              >
                <Plus size={15} /> Add Custom Variant
              </button>
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[11px] font-bold text-[#8C8479] uppercase tracking-wider mr-2">
                Quick Presets:
              </span>
              <div className="inline-flex flex-wrap gap-2 mt-1.5">
                {VARIANT_PRESETS.map((vp) => (
                  <button
                    key={vp.label}
                    type="button"
                    onClick={() => applyVariantPreset(vp.variants)}
                    className="text-xs px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#DCD6CC] text-[#5C564E] hover:border-[#5A7A56] hover:text-[#5A7A56] transition"
                  >
                    + {vp.label}
                  </button>
                ))}
              </div>
            </div>

            {variants.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-2xl border-2 border-dashed border-[#DCD6CC] bg-[#FAF7F2]/50 text-[#8C8479]">
                <p className="text-sm font-medium">No size variants added yet.</p>
                <p className="text-xs mt-1">
                  Click a Quick Preset above or &quot;+ Add Custom Variant&quot; to specify size options.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {variants.map((v, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] flex items-center gap-3"
                  >
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-[#8C8479] uppercase mb-1">
                        Age / Size
                      </label>
                      <input
                        type="text"
                        value={v.year}
                        onChange={(e) => updateVariant(idx, 'year', e.target.value)}
                        required
                        placeholder="e.g. 2-3Y"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCD6CC] text-xs font-semibold text-[#2E2A27] focus:outline-none focus:border-[#5A7A56]"
                      />
                    </div>

                    <div className="w-28 sm:w-32">
                      <label className="block text-[10px] font-bold text-[#8C8479] uppercase mb-1">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={String(v.price)}
                        onChange={(e) => updateVariant(idx, 'price', e.target.value)}
                        required
                        placeholder="699"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCD6CC] text-xs font-semibold text-[#2E2A27] focus:outline-none focus:border-[#5A7A56]"
                      />
                    </div>

                    <div className="w-24 sm:w-28">
                      <label className="block text-[10px] font-bold text-[#8C8479] uppercase mb-1">
                        Stock Qty
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={String(v.stock)}
                        onChange={(e) => updateVariant(idx, 'stock', e.target.value)}
                        required
                        placeholder="10"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCD6CC] text-xs font-semibold text-[#2E2A27] focus:outline-none focus:border-[#5A7A56]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      className="mt-4 p-2 text-red-500 hover:bg-red-50 rounded-xl transition"
                      title="Remove variant"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 3: Optional Highlights & Badges */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D9] shadow-xs space-y-5">
            <h2
              className="text-xl font-bold text-[#2E2A27] flex items-center gap-2"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              <Sparkles size={18} className="text-[#5A7A56]" />
              Promotional Badge (Optional)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#5C564E] uppercase tracking-wider mb-2">
                  Badge Label
                </label>
                <input
                  type="text"
                  name="badge"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="e.g. 100% ORGANIC"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DCD6CC] bg-[#FAF7F2]/40 text-xs focus:outline-none focus:border-[#5A7A56]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5C564E] uppercase tracking-wider mb-2">
                  Background Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={badgeBg || '#5A7A56'}
                    onChange={(e) => setBadgeBg(e.target.value)}
                    className="w-9 h-9 rounded-xl border border-[#DCD6CC] cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    name="badgeBg"
                    value={badgeBg}
                    onChange={(e) => setBadgeBg(e.target.value)}
                    placeholder="#5A7A56"
                    className="flex-1 px-3 py-2 rounded-xl border border-[#DCD6CC] text-xs font-mono focus:outline-none focus:border-[#5A7A56]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5C564E] uppercase tracking-wider mb-2">
                  Text Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={badgeColor || '#ffffff'}
                    onChange={(e) => setBadgeColor(e.target.value)}
                    className="w-9 h-9 rounded-xl border border-[#DCD6CC] cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    name="badgeColor"
                    value={badgeColor}
                    onChange={(e) => setBadgeColor(e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1 px-3 py-2 rounded-xl border border-[#DCD6CC] text-xs font-mono focus:outline-none focus:border-[#5A7A56]"
                  />
                </div>
              </div>
            </div>

            {/* Quick Badge Themes */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-[11px] font-bold text-[#8C8479] uppercase">Presets:</span>
              {BADGE_PRESETS.map((bp) => (
                <button
                  key={bp.label}
                  type="button"
                  onClick={() => {
                    setBadgeBg(bp.bg);
                    setBadgeColor(bp.color);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg text-white font-medium shadow-2xs hover:scale-105 transition"
                  style={{ backgroundColor: bp.bg }}
                >
                  {bp.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) - Media Upload & Live Preview */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
          {/* Media Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#E8E2D9] shadow-xs space-y-4">
            <h2
              className="text-lg font-bold text-[#2E2A27] flex items-center justify-between"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              <span>Product Photos</span>
              <span className="text-xs font-normal text-[#8C8479]">
                {allPreviewImages.length} attached
              </span>
            </h2>

            {/* Upload Area */}
            <label className="relative border-2 border-dashed border-[#5A7A56]/40 hover:border-[#5A7A56] bg-[#5A7A56]/5 hover:bg-[#5A7A56]/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition">
              <div className="w-10 h-10 rounded-full bg-[#5A7A56]/15 text-[#5A7A56] flex items-center justify-center">
                <UploadCloud size={20} />
              </div>
              <div>
                <span className="text-xs font-bold text-[#5A7A56]">Click to upload</span>
                <span className="text-xs text-[#7A7367]"> or drag photos</span>
              </div>
              <span className="text-[10px] text-[#8C8479]">JPG, PNG, WebP up to 4.5MB each</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>

            {/* Photos Grid */}
            {allPreviewImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                {/* Existing Images */}
                {existingImages.map((url, idx) => (
                  <div
                    key={`exist-${idx}`}
                    className="relative aspect-square rounded-xl overflow-hidden border border-[#DCD6CC] group shadow-2xs bg-[#F5F2EB]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Product image" className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-[#5A7A56] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                        COVER
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeExistingImage(idx)}
                      className="absolute top-1 right-1 bg-red-500/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-xs"
                      title="Delete photo"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                {/* New Files */}
                {newFiles.map((fp) => (
                  <div
                    key={fp.id}
                    className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-[#5A7A56]/50 group shadow-2xs bg-[#F5F2EB]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fp.url} alt="New upload" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[7px] font-bold px-1 py-0.2 rounded shadow-xs">
                      NEW
                    </span>
                    <button
                      type="button"
                      onClick={() => removeNewFile(fp.id)}
                      className="absolute top-1 right-1 bg-red-500/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-xs"
                      title="Remove photo"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Storefront Preview Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#E8E2D9] shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#8C8479] uppercase tracking-wider">
              <span>Live Card Preview</span>
              <span className="text-[#5A7A56]">Catalogue Look</span>
            </div>

            <div className="rounded-2xl border border-[#E8E2D9] overflow-hidden bg-white shadow-sm max-w-[280px] mx-auto">
              <div className="relative aspect-4/5 bg-[#F3EFE6] flex items-center justify-center overflow-hidden">
                {primaryThumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={primaryThumbnail}
                    alt={name || 'Preview'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center text-[#A39B8F] gap-1">
                    <ImageIcon size={32} />
                    <span className="text-[11px]">No image yet</span>
                  </div>
                )}

                {badge && (
                  <span
                    className="absolute top-2.5 left-2.5 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs tracking-wider uppercase"
                    style={{ backgroundColor: badgeBg, color: badgeColor }}
                  >
                    {badge}
                  </span>
                )}
              </div>

              <div className="p-3.5 space-y-1">
                <h4 className="font-bold text-sm text-[#2E2A27] truncate">
                  {name || 'Product Title'}
                </h4>
                <p className="text-[11px] text-[#7A7367] truncate">
                  {features || 'Product highlights & fabric'}
                </p>
                <div className="pt-2 flex items-center justify-between">
                  <span className="font-extrabold text-sm text-[#2E2A27]">
                    ₹{basePrice ? Number(basePrice).toLocaleString('en-IN') : '0'}
                  </span>
                  <span className="text-[10px] bg-[#FAF7F2] border border-[#DCD6CC] px-2 py-0.5 rounded-md text-[#5C564E]">
                    {variants.length > 0 ? `${variants.length} Sizes` : 'Default'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Submit & Navigation Actions */}
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={isPendingLocal}
              className="w-full py-4 rounded-2xl bg-[#5A7A56] hover:bg-[#486345] text-white font-bold text-sm shadow-md shadow-[#5A7A56]/25 transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isPendingLocal && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isPendingLocal
                ? isEditing
                  ? 'Saving Changes...'
                  : 'Adding Product...'
                : isEditing
                ? 'Save Product Changes'
                : 'Publish Product to Catalogue'}
            </button>

            <Link
              href="/admin/products"
              className="w-full py-3 rounded-2xl bg-white border border-[#DCD6CC] hover:bg-[#FAF7F2] text-[#5C564E] font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft size={14} /> Back to Products
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
