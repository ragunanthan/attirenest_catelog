'use client';

import { useActionState, useRef, useEffect, useState, useTransition } from 'react';
import { addProductAction, updateProductAction } from '../actions';

type Category = {
  id: string;
  name: string;
};

type Variant = {
  year: number;
  price: number;
  stock: number;
};

type Product = {
  id: number;
  categoryId: string;
  name: string;
  features: string;
  description: string;
  basePrice: number;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  images: string[];
  variants?: Variant[];
};

type FilePreview = {
  id: string;
  file: File;
  url: string;
};

export default function AddProductForm({ 
  categories, 
  product, 
  onCancel 
}: { 
  categories: Category[]; 
  product?: Product;
  onCancel?: () => void;
}) {
  const isEditing = !!product;
  const action = isEditing ? updateProductAction : addProductAction;
  const [state, formAction, isPending] = useActionState(action, null as any);
  const formRef = useRef<HTMLFormElement>(null);
  const [isPendingLocal, startTransition] = useTransition();

  const [variants, setVariants] = useState<Variant[]>(product?.variants || []);
  const [existingImages, setExistingImages] = useState<string[]>(product?.images || []);
  const [newFiles, setNewFiles] = useState<FilePreview[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB
  const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20MB

  useEffect(() => {
    if (state?.success && formRef.current && !isEditing) {
      formRef.current.reset();
      setVariants([]);
      setNewFiles([]);
      setExistingImages([]);
      setLocalError(null);
    }
  }, [state, isEditing]);

  const addVariant = () => {
    setVariants(prev => [...prev, { year: 1, price: 0, stock: 0 }]);
  };

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string) => {
    const numVal = value === '' ? 0 : Number(value);
    setVariants(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: isNaN(numVal) ? 0 : numVal };
      return next;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    const files = Array.from(e.target.files || []);
    
    // Check individual file sizes
    const oversizedFiles = files.filter(f => f.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setLocalError(`Some files are too large (Max 4.5MB per image): ${oversizedFiles.map(f => f.name).join(', ')}`);
      e.target.value = '';
      return;
    }

    // Check total size
    const currentTotal = newFiles.reduce((acc, curr) => acc + curr.file.size, 0);
    const incomingTotal = files.reduce((acc, curr) => acc + curr.size, 0);
    if (currentTotal + incomingTotal > MAX_TOTAL_SIZE) {
      setLocalError("Total upload size exceeds 20MB limit. Please upload fewer or smaller images.");
      e.target.value = '';
      return;
    }

    const newPreviews = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      url: URL.createObjectURL(file)
    }));
    setNewFiles(prev => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewFile = (id: string) => {
    setNewFiles(prev => {
      const target = prev.find(p => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter(p => p.id !== id);
    });
  };

  // Custom form action to handle the file array from state
  const handleFormAction = (formData: FormData) => {
    formData.delete('images'); // Clear any default file input value
    newFiles.forEach(fp => {
      formData.append('images', fp.file);
    });
    formData.set('existingImages', JSON.stringify(existingImages));
    formData.set('variantsJson', JSON.stringify(variants));
    
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <form action={handleFormAction} ref={formRef} className="space-y-6">
      {isEditing && <input type="hidden" name="id" value={product.id} />}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-[#4a4642] mb-1.5">Product Name</label>
          <input
            type="text"
            name="name"
            defaultValue={product?.name}
            required
            className="w-full px-4 py-3 rounded-xl border border-[#A8C3A5]/30 focus:outline-none focus:border-[#2E2A27] transition"
            placeholder="e.g., Cloud Cotton Tee"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#4a4642] mb-1.5">Category</label>
          <select
            name="categoryId"
            defaultValue={product?.categoryId}
            required
            className="w-full px-4 py-3 rounded-xl border border-[#A8C3A5]/30 focus:outline-none focus:border-[#2E2A27] transition bg-white"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#4a4642] mb-1.5">Features (Short)</label>
          <input
            type="text"
            name="features"
            defaultValue={product?.features}
            required
            className="w-full px-4 py-3 rounded-xl border border-[#A8C3A5]/30 focus:outline-none focus:border-[#2E2A27] transition"
            placeholder="e.g., GOTS organic • pastel mint"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#4a4642] mb-1.5">Default Base Price (₹)</label>
          <input
            type="number"
            name="basePrice"
            defaultValue={product?.basePrice}
            required
            className="w-full px-4 py-3 rounded-xl border border-[#A8C3A5]/30 focus:outline-none focus:border-[#2E2A27] transition"
            placeholder="e.g., 599"
          />
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="pt-4 border-t border-[#A8C3A5]/10">
        <label className="block text-sm font-medium text-[#4a4642] mb-3">Product Images</label>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
          {/* Existing Images */}
          {existingImages.map((url, idx) => (
            <div key={`exist-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-[#A8C3A5]/20 group shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Existing" className="w-full h-full object-cover" />
              <button 
                type="button"
                onClick={() => removeExistingImage(idx)}
                className="absolute top-1.5 right-1.5 bg-red-500/90 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-md scale-90 group-hover:scale-100"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] py-1 text-center font-bold tracking-wider">EXISTING</div>
            </div>
          ))}

          {/* Previews of New Files */}
          {newFiles.map((fp) => (
            <div key={fp.id} className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-[#5A7A56]/30 group shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fp.url} alt="New preview" className="w-full h-full object-cover opacity-90" />
              <button 
                type="button"
                onClick={() => removeNewFile(fp.id)}
                className="absolute top-1.5 right-1.5 bg-red-500/90 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-md scale-90 group-hover:scale-100"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-[#5A7A56]/80 text-white text-[8px] py-1 text-center font-bold tracking-wider">NEW</div>
            </div>
          ))}

          {/* Upload Button Placeholder */}
          <label className="relative aspect-square rounded-xl border-2 border-dashed border-[#A8C3A5]/40 hover:border-[#2E2A27]/40 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 bg-[#A8C3A5]/5 hover:bg-[#A8C3A5]/10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b6762" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            <span className="text-[10px] font-semibold text-[#6b6762] uppercase tracking-wider text-center px-2">Add Photo</span>
            <input 
              type="file" 
              multiple 
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>
        <p className="text-[11px] text-[#9a938c]">
          Upload high-quality images (Max 4.5MB per image). The first image will be the main thumbnail.
        </p>
      </div>

      {/* Stock & Variants */}
      <div className="pt-4 border-t border-[#A8C3A5]/10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-[#4a4642]">Stock & Price per Year</h3>
          <button 
            type="button" 
            onClick={addVariant}
            className="text-xs px-3 py-1.5 rounded-lg bg-[#A8C3A5]/20 text-[#5A7A56] font-medium hover:bg-[#A8C3A5]/30 transition"
          >
            + Add Year Variant
          </button>
        </div>
        
        {variants.length === 0 ? (
          <p className="text-xs text-[#9a938c] italic mb-4">No variants added yet. These will appear in the frontend dropdown.</p>
        ) : (
          <div className="space-y-3 mb-6">
            {variants.map((variant, index) => (
              <div key={index} className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-[10px] font-medium text-[#7a766f] mb-1 uppercase">Year</label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={String(variant.year)}
                    onChange={(e) => updateVariant(index, 'year', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#A8C3A5]/30 text-sm focus:outline-none"
                    placeholder="e.g. 2"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-medium text-[#7a766f] mb-1 uppercase">Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={String(variant.price)}
                    onChange={(e) => updateVariant(index, 'price', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#A8C3A5]/30 text-sm focus:outline-none"
                    placeholder="e.g. 699"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-medium text-[#7a766f] mb-1 uppercase">Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={String(variant.stock)}
                    onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#A8C3A5]/30 text-sm focus:outline-none"
                    placeholder="0"
                    required
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="p-2 text-red-400 hover:text-red-600 transition"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[#4a4642] mb-1.5">Full Description</label>
        <textarea
          name="description"
          defaultValue={product?.description}
          required
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-[#A8C3A5]/30 focus:outline-none focus:border-[#2E2A27] transition"
          placeholder="Detailed description of the product..."
        ></textarea>
      </div>

      <div className="pt-4 border-t border-[#A8C3A5]/10">
        <h3 className="text-sm font-semibold mb-4 text-[#4a4642]">Optional Badge Details</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-[11px] font-medium text-[#7a766f] mb-1.5 uppercase tracking-wider">Badge Text</label>
            <input
              type="text"
              name="badge"
              defaultValue={product?.badge}
              className="w-full px-4 py-2.5 rounded-xl border border-[#A8C3A5]/30 focus:outline-none focus:border-[#2E2A27] transition text-sm"
              placeholder="e.g., ORGANIC"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#7a766f] mb-1.5 uppercase tracking-wider">Badge BG Color</label>
            <input
              type="text"
              name="badgeBg"
              defaultValue={product?.badgeBg}
              className="w-full px-4 py-2.5 rounded-xl border border-[#A8C3A5]/30 focus:outline-none focus:border-[#2E2A27] transition text-sm"
              placeholder="e.g., #A8C3A5"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#7a766f] mb-1.5 uppercase tracking-wider">Badge Text Color</label>
            <input
              type="text"
              name="badgeColor"
              defaultValue={product?.badgeColor}
              className="w-full px-4 py-2.5 rounded-xl border border-[#A8C3A5]/30 focus:outline-none focus:border-[#2E2A27] transition text-sm"
              placeholder="e.g., #ffffff"
            />
          </div>
        </div>
      </div>

      {localError && (
        <p className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg border border-red-100">{localError}</p>
      )}

      {(state?.error) && (
        <p className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg">{state.error}</p>
      )}
      
      {state?.success && (
        <p className="text-green-600 text-sm text-center font-medium bg-green-50 py-2 rounded-lg">{state.success}</p>
      )}

      <div className="flex gap-4 pt-2">
        {isEditing && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-4 rounded-xl border border-[#A8C3A5]/30 text-[#4a4642] font-semibold hover:bg-[#A8C3A5]/10 transition"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isPending || isPendingLocal}
          className="flex-[2] py-4 rounded-xl bg-[#2E2A27] text-white font-semibold hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-[#2E2A27]/20 flex items-center justify-center gap-2"
        >
          {(isPending || isPendingLocal) && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {(isPending || isPendingLocal) ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Product' : 'Add Product to Catalogue')}
        </button>
      </div>
    </form>
  );
}
