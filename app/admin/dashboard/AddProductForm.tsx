'use client';

import { useActionState, useRef, useEffect } from 'react';
import { addProductAction, updateProductAction } from '../actions';

type Category = {
  id: string;
  name: string;
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

  useEffect(() => {
    if (state?.success && formRef.current && !isEditing) {
      formRef.current.reset();
    }
  }, [state, isEditing]);

  return (
    <form action={formAction} ref={formRef} className="space-y-6">
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
          <label className="block text-sm font-medium text-[#4a4642] mb-1.5">Age Range</label>
          <input
            type="text"
            name="ageRange"
            defaultValue={product?.ageRange}
            required
            className="w-full px-4 py-3 rounded-xl border border-[#A8C3A5]/30 focus:outline-none focus:border-[#2E2A27] transition"
            placeholder="e.g., 2-4Y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#4a4642] mb-1.5">Base Price (₹)</label>
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
