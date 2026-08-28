import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Category from '@/lib/models/Category';
import Product from '@/lib/models/Product';
import { AdminShell } from '../components/AdminShell';
import { ProductsTable, ProductItem, CategoryItem } from './ProductsTable';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface RawCategoryDoc {
  id: string;
  name: string;
}

interface RawProductDoc {
  id: number;
  categoryId: string;
  name: string;
  features: string;
  description: string;
  basePrice: number;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  images?: string[];
  variants?: Array<{
    year: string;
    price: number;
    stock: number;
  }>;
}

export default async function AdminProductsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/admin');
  }

  await dbConnect();
  const [rawCategories, rawProducts] = (await Promise.all([
    Category.find({}).lean(),
    Product.find({}).sort({ id: -1 }).lean(),
  ])) as unknown as [RawCategoryDoc[], RawProductDoc[]];

  const categories: CategoryItem[] = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const products: ProductItem[] = rawProducts.map((p) => ({
    id: p.id,
    categoryId: p.categoryId,
    name: p.name,
    features: p.features,
    description: p.description,
    basePrice: p.basePrice,
    badge: p.badge,
    badgeBg: p.badgeBg,
    badgeColor: p.badgeColor,
    images: p.images || [],
    variants: (p.variants || []).map((v) => ({
      year: v.year,
      price: v.price,
      stock: v.stock,
    })),
  }));

  return (
    <AdminShell
      title="Product Inventory"
      subtitle="Manage your catalog items, check stock levels, and update prices."
      actions={
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#5A7A56] hover:bg-[#486345] text-white text-xs font-bold shadow-md shadow-[#5A7A56]/20 transition"
        >
          <Plus size={16} /> Add New Product
        </Link>
      }
    >
      <ProductsTable products={products} categories={categories} />
    </AdminShell>
  );
}
