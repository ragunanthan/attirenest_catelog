'use client';

import { useState, useTransition } from 'react';
import {
  addCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  ActionResponse,
} from '../actions';
import {
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Package,
} from 'lucide-react';

export interface CategoryItem {
  id: string;
  name: string;
  description: string;
  theme: string;
  productCount: number;
}

interface CategoriesManagerProps {
  categories: CategoryItem[];
}

const THEME_OPTIONS = [
  { id: 'sage', label: 'Sage Green', hex: '#5A7A56' },
  { id: 'terracotta', label: 'Terracotta', hex: '#C86D51' },
  { id: 'mustard', label: 'Mustard Gold', hex: '#D97706' },
  { id: 'rose', label: 'Dusty Rose', hex: '#E11D48' },
  { id: 'navy', label: 'Classic Navy', hex: '#1E3A8A' },
  { id: 'emerald', label: 'Emerald', hex: '#059669' },
  { id: 'amber', label: 'Warm Amber', hex: '#B45309' },
  { id: 'charcoal', label: 'Warm Charcoal', hex: '#2E2A27' },
];

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const [isPending, startTransition] = useTransition();

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTheme, setFormTheme] = useState('sage');

  // Delete Modal State
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);
  const [reassignTarget, setReassignTarget] = useState('');

  // Status Alerts
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormDesc('');
    setFormTheme('sage');
    setStatusMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.id);
    setFormDesc(cat.description);
    setFormTheme(cat.theme || 'sage');
    setStatusMessage(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingCategory) {
      // Auto-slugify
      const autoSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormSlug(autoSlug);
    }
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const formData = new FormData();
    formData.set('name', formName);
    formData.set('id', formSlug);
    formData.set('description', formDesc);
    formData.set('theme', formTheme);

    startTransition(async () => {
      let res: ActionResponse;
      if (editingCategory) {
        formData.set('oldId', editingCategory.id);
        res = await updateCategoryAction(null, formData);
      } else {
        res = await addCategoryAction(null, formData);
      }

      if (res.error) {
        setStatusMessage({ type: 'error', text: res.error });
      } else {
        setStatusMessage({ type: 'success', text: res.success || 'Category saved successfully!' });
        setIsModalOpen(false);
      }
    });
  };

  const openDeleteModal = (cat: CategoryItem) => {
    setDeletingCategory(cat);
    // Default reassignment to first available other category
    const otherCategories = categories.filter((c) => c.id !== cat.id);
    setReassignTarget(otherCategories[0]?.id || '');
    setStatusMessage(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingCategory) return;
    setStatusMessage(null);

    startTransition(async () => {
      const res = await deleteCategoryAction(
        deletingCategory.id,
        deletingCategory.productCount > 0 ? reassignTarget : undefined
      );

      if (res.error) {
        setStatusMessage({ type: 'error', text: res.error });
      } else {
        setStatusMessage({ type: 'success', text: res.success || 'Category deleted successfully!' });
        setDeletingCategory(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E8E2D9] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#2E2A27]" style={{ fontFamily: "'Fraunces', serif" }}>
            Catalog Sections & Categories
          </h2>
          <p className="text-xs text-[#7A7367] mt-1">
            Organize products into dedicated showcase categories on the homepage.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#5A7A56] hover:bg-[#486345] text-white text-xs font-bold shadow-md shadow-[#5A7A56]/20 transition cursor-pointer"
        >
          <Plus size={16} /> Create Category
        </button>
      </div>

      {/* Status Notifications */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle size={16} className="text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs opacity-70 hover:opacity-100">
            &times;
          </button>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => {
          const themeInfo = THEME_OPTIONS.find((t) => t.id === cat.theme) || THEME_OPTIONS[0];

          return (
            <div
              key={cat.id}
              className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs flex flex-col justify-between hover:border-[#5A7A56]/40 transition group"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white shadow-2xs"
                    style={{ backgroundColor: themeInfo.hex }}
                  >
                    {themeInfo.label}
                  </span>

                  <span className="text-[11px] font-bold text-[#8C8479] font-mono bg-[#FAF7F2] px-2 py-0.5 rounded-lg border border-[#E8E2D9]">
                    /{cat.id}
                  </span>
                </div>

                {/* Name & Desc */}
                <h3 className="font-bold text-lg text-[#2E2A27]">{cat.name}</h3>
                <p className="text-xs text-[#7A7367] mt-1.5 line-clamp-2">{cat.description}</p>
              </div>

              {/* Footer info & Actions */}
              <div className="pt-5 mt-5 border-t border-[#E8E2D9]/70 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-[#5C564E] font-medium">
                  <Package size={14} className="text-[#8C8479]" />
                  <span>
                    <strong>{cat.productCount}</strong> product{cat.productCount !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-2 rounded-xl text-[#5A7A56] hover:bg-[#5A7A56]/15 transition cursor-pointer"
                    title="Edit category"
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    onClick={() => openDeleteModal(cat)}
                    className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition cursor-pointer"
                    title="Delete category"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#E8E2D9] space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
              <h3 className="text-xl font-bold text-[#2E2A27]" style={{ fontFamily: "'Fraunces', serif" }}>
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-[#8C8479] hover:bg-[#FAF7F2] transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#5C564E] uppercase tracking-wider mb-1.5">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  placeholder="e.g., Festive & Occasion"
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#DCD6CC] text-sm text-[#2E2A27] focus:outline-none focus:border-[#5A7A56]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5C564E] uppercase tracking-wider mb-1.5">
                  Slug ID (URL Key) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  required
                  placeholder="e.g., festive"
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#DCD6CC] text-sm font-mono text-[#2E2A27] focus:outline-none focus:border-[#5A7A56]"
                />
                <p className="text-[10px] text-[#8C8479] mt-1">
                  Used as the section link anchor on the homepage navigation.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5C564E] uppercase tracking-wider mb-1.5">
                  Short Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  required
                  placeholder="Brief tagline explaining this clothing category..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#DCD6CC] text-sm text-[#2E2A27] focus:outline-none focus:border-[#5A7A56] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5C564E] uppercase tracking-wider mb-2">
                  Theme Color Palette
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {THEME_OPTIONS.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setFormTheme(theme.id)}
                      className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                        formTheme === theme.id
                          ? 'border-[#5A7A56] bg-[#5A7A56]/10 text-[#5A7A56]'
                          : 'border-[#DCD6CC] bg-[#FAF7F2] text-[#5C564E] hover:border-[#8C8479]'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: theme.hex }} />
                      <span className="truncate">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl border border-[#DCD6CC] text-[#5C564E] font-semibold text-xs hover:bg-[#FAF7F2] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-3 rounded-2xl bg-[#5A7A56] hover:bg-[#486345] text-white font-bold text-xs shadow-md shadow-[#5A7A56]/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isPending ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Delete Category Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#E8E2D9] space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-[#2E2A27]">
                Delete &quot;{deletingCategory.name}&quot;?
              </h3>
              <p className="text-xs text-[#7A7367] mt-1.5">
                This category will be permanently removed from your catalog.
              </p>
            </div>

            {/* Product Protection Safeguard */}
            {deletingCategory.productCount > 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2.5">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle size={15} className="text-amber-700 shrink-0" />
                  <span>{deletingCategory.productCount} active product(s) in this category</span>
                </div>
                <p className="leading-relaxed">
                  To prevent orphaned products, please select where to reassign these {deletingCategory.productCount} product(s):
                </p>

                <select
                  value={reassignTarget}
                  onChange={(e) => setReassignTarget(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-semibold text-[#2E2A27] focus:outline-none"
                >
                  {categories
                    .filter((c) => c.id !== deletingCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        Move to: {c.name} ({c.id})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center font-medium">
                No products are currently in this category. It is safe to delete.
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="flex-1 py-3 rounded-2xl border border-[#DCD6CC] text-[#5C564E] font-semibold text-xs hover:bg-[#FAF7F2] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isPending || (deletingCategory.productCount > 0 && !reassignTarget)}
                className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
