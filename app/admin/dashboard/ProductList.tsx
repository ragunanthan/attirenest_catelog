'use client';

import { useState } from 'react';
import { deleteProductAction } from '../actions';
import AddProductForm from './AddProductForm';

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

type Category = {
  id: string;
  name: string;
};

export default function ProductList({ 
  products, 
  categories 
}: { 
  products: Product[]; 
  categories: Category[];
}) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setIsDeleting(id);
      await deleteProductAction(id);
      setIsDeleting(null);
    }
  };

  if (editingProduct) {
    return (
      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[24px] font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>Edit Product</h2>
          <button 
            onClick={() => setEditingProduct(null)}
            className="text-sm text-[#A8C3A5] hover:text-[#2E2A27] transition"
          >
            ← Back to List
          </button>
        </div>
        <AddProductForm 
          categories={categories} 
          product={editingProduct} 
          onCancel={() => setEditingProduct(null)} 
        />
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h2 className="text-[24px] font-semibold mb-6" style={{ fontFamily: "'Fraunces', serif" }}>Existing Products</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#A8C3A5]/20 text-left">
              <th className="py-4 px-2 text-sm font-semibold text-[#4a4642]">ID</th>
              <th className="py-4 px-2 text-sm font-semibold text-[#4a4642]">Image</th>
              <th className="py-4 px-2 text-sm font-semibold text-[#4a4642]">Name</th>
              <th className="py-4 px-2 text-sm font-semibold text-[#4a4642]">Category</th>
              <th className="py-4 px-2 text-sm font-semibold text-[#4a4642]">Price</th>
              <th className="py-4 px-2 text-sm font-semibold text-[#4a4642] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-[#A8C3A5]/10 hover:bg-[#A8C3A5]/5 transition">
                <td className="py-4 px-2 text-sm text-[#6b6762]">{product.id}</td>
                <td className="py-4 px-2">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#f5f5f5]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                </td>
                <td className="py-4 px-2">
                  <div className="text-sm font-medium text-[#2E2A27]">{product.name}</div>
                  <div className="text-[11px] text-[#7a766f]">{product.ageRange}</div>
                </td>
                <td className="py-4 px-2 text-sm text-[#6b6762]">
                  {categories.find(c => c.id === product.categoryId)?.name || product.categoryId}
                </td>
                <td className="py-4 px-2 text-sm font-medium text-[#2E2A27]">₹{product.basePrice.toLocaleString('en-IN')}</td>
                <td className="py-4 px-2 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="p-2 rounded-lg hover:bg-[#A8C3A5]/20 text-[#5A7A56] transition"
                      title="Edit"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={isDeleting === product.id}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition disabled:opacity-50"
                      title="Delete"
                    >
                      {isDeleting === product.id ? (
                        <span className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin block"></span>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {products.length === 0 && (
        <div className="text-center py-12 text-[#9a938c]">
          No products found. Start by adding one above!
        </div>
      )}
    </div>
  );
}
