'use client';

import { useActionState, useRef, useEffect, useState } from 'react';
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
  image: string;
  variants?: Variant[];
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [state, formAction, isPending] = useActionState(action, null as any);
  const formRef = useRef<HTMLFormElement>(null);

  const [variants, setVariants] = useState<Variant[]>(product?.variants || []);

  useEffect(() => {
    if (state?.success && formRef.current && !isEditing) {
      formRef.current.reset();
      setVariants([]);
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

  return (
    <form action={formAction} ref={formRef} className="space-y-6">
      {isEditing && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="variantsJson" value={JSON.stringify(variants)} />

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

        <div>
          <label className="block text-sm font-medium text-[#4a4642] mb-1.5">Image URL</label>
          <input
            type="url"
            name="image"
            defaultValue={product?.image}
            required
            className="w-full px-4 py-3 rounded-xl border border-[#A8C3A5]/30 focus:outline-none focus:border-[#2E2A27] transition"
            placeholder="https://images.unsplash.com/..."
          />
        </div>
      </div>

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

      {state?.error && (
        <p className="text-red-500 text-sm text-center">{state.error}</p>
      )}
      
      {state?.success && (
        <p className="text-green-600 text-sm text-center font-medium">{state.success}</p>
      )}

      <div className="flex gap-4">
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
          disabled={isPending}
          className="flex-[2] py-4 rounded-xl bg-[#2E2A27] text-white font-semibold hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-[#2E2A27]/20"
        >
          {isPending ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Product' : 'Add Product to Catalogue')}
        </button>
      </div>
    </form>
  );
}
