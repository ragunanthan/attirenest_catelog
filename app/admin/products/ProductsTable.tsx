'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { deleteProductAction } from '../actions';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export interface ProductItem {
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
  variants?: {
    year: string;
    price: number;
    stock: number;
  }[];
}

export interface CategoryItem {
  id: string;
  name: string;
}

interface ProductsTableProps {
  products: ProductItem[];
  categories: CategoryItem[];
}

export function ProductsTable({ products, categories }: ProductsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c.name]));
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      const matchesSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.features.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(p.id).includes(searchQuery);

      // Category
      const matchesCategory =
        selectedCategory === 'all' || p.categoryId === selectedCategory;

      // Stock
      const totalStock = p.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
      let matchesStock = true;
      if (stockFilter === 'in_stock') {
        matchesStock = totalStock > 3;
      } else if (stockFilter === 'low_stock') {
        matchesStock = totalStock > 0 && totalStock <= 3;
      } else if (stockFilter === 'out_of_stock') {
        matchesStock = totalStock === 0;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      setDeletingId(id);
      await deleteProductAction(id);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8E2D9] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8479]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by title, ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#DCD6CC] text-xs font-medium text-[#2E2A27] focus:outline-none focus:border-[#5A7A56] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8C8479] hover:text-[#2E2A27]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#DCD6CC] text-xs font-semibold text-[#4A443B] focus:outline-none focus:border-[#5A7A56] cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) =>
              setStockFilter(
                e.target.value as 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
              )
            }
            className="px-3.5 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#DCD6CC] text-xs font-semibold text-[#4A443B] focus:outline-none focus:border-[#5A7A56] cursor-pointer"
          >
            <option value="all">All Stock Status</option>
            <option value="in_stock">In Stock (&gt;3)</option>
            <option value="low_stock">Low Stock (1-3)</option>
            <option value="out_of_stock">Sold Out (0)</option>
          </select>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#5A7A56] hover:bg-[#486345] text-white text-xs font-bold shadow-md shadow-[#5A7A56]/20 transition ml-auto md:ml-0"
          >
            <Plus size={16} /> Add Product
          </Link>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs font-medium text-[#7A7367] px-2">
        <span>
          Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> items
        </span>
        {(searchQuery || selectedCategory !== 'all' || stockFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setStockFilter('all');
            }}
            className="text-[#5A7A56] hover:underline font-semibold"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#E8E2D9] text-[11px] font-bold text-[#8C8479] uppercase tracking-wider">
                <th className="py-4 px-5">Product</th>
                <th className="py-4 px-4">Category</th>
                <th className="py-4 px-4">Base Price</th>
                <th className="py-4 px-4">Size Variants & Stock</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D9]/70 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[#8C8479]">
                    <div className="w-12 h-12 rounded-full bg-[#FAF7F2] flex items-center justify-center mx-auto mb-3 text-[#A39B8F]">
                      <Package size={24} />
                    </div>
                    <p className="font-semibold text-[#2E2A27]">No products found</p>
                    <p className="text-xs text-[#8C8479] mt-1">
                      Try adjusting your search terms or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const totalStock = p.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
                  const hasVariants = p.variants && p.variants.length > 0;
                  const categoryName = categoryMap.get(p.categoryId) || p.categoryId;

                  return (
                    <tr key={p.id} className="hover:bg-[#FAF7F2]/50 transition group">
                      {/* Product Column */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-14 rounded-xl overflow-hidden bg-[#F3EFE6] shrink-0 border border-[#E8E2D9] relative">
                            {p.images?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#A39B8F]">
                                <Package size={18} />
                              </div>
                            )}
                            {p.images?.length > 1 && (
                              <span className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[8px] font-bold px-1 rounded-sm">
                                +{p.images.length - 1}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-[#2E2A27] flex items-center gap-2">
                              <span>{p.name}</span>
                              {p.badge && (
                                <span
                                  className="text-[9px] font-bold px-1.5 py-0.2 rounded-md uppercase tracking-wider shrink-0"
                                  style={{
                                    backgroundColor: p.badgeBg || '#5A7A56',
                                    color: p.badgeColor || '#ffffff',
                                  }}
                                >
                                  {p.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#7A7367] truncate max-w-xs mt-0.5">
                              {p.features}
                            </p>
                            <span className="text-[10px] text-[#A39B8F] font-mono">
                              ID: #{p.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category Column */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#DCD6CC] text-xs font-semibold text-[#5C564E]">
                          {categoryName}
                        </span>
                      </td>

                      {/* Base Price */}
                      <td className="py-4 px-4 font-extrabold text-[#2E2A27]">
                        ₹{p.basePrice.toLocaleString('en-IN')}
                      </td>

                      {/* Variants & Stock Matrix */}
                      <td className="py-4 px-4">
                        {hasVariants ? (
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {p.variants?.map((v, i) => (
                              <span
                                key={i}
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                  v.stock === 0
                                    ? 'bg-red-50 border-red-200 text-red-700 opacity-60'
                                    : v.stock <= 3
                                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                                    : 'bg-[#FAF7F2] border-[#E8E2D9] text-[#4A443B]'
                                }`}
                              >
                                <strong>{v.year}</strong>: {v.stock} pcs (₹{v.price})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-[#A39B8F] italic">No variants</span>
                        )}
                      </td>

                      {/* Overall Stock Status */}
                      <td className="py-4 px-4">
                        {totalStock === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                            <XCircle size={13} /> Sold Out
                          </span>
                        ) : totalStock <= 3 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                            <AlertTriangle size={13} /> Low ({totalStock})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                            <CheckCircle2 size={13} /> {totalStock} in stock
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="p-2 rounded-xl text-[#5A7A56] hover:bg-[#5A7A56]/15 transition"
                            title="Edit product"
                          >
                            <Edit size={16} />
                          </Link>

                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            disabled={deletingId === p.id}
                            className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
                            title="Delete product"
                          >
                            {deletingId === p.id ? (
                              <span className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin block" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
