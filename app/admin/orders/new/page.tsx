import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';
import { AdminShell } from '../../components/AdminShell';
import {
  CreateStoreOrderForm,
  StoreProduct,
  StoreCategory,
} from '../CreateStoreOrderForm';

export const dynamic = 'force-dynamic';

interface RawCategoryDoc {
  id: string;
  name: string;
}

interface RawProductDoc {
  id: number;
  name: string;
  categoryId: string;
  basePrice: number;
  images?: string[];
  variants?: {
    year: string;
    price: number;
    stock: number;
  }[];
}

export default async function NewStoreOrderPage() {
  const session = await getSession();
  if (!session) {
    redirect('/admin');
  }

  await dbConnect();

  const [rawProducts, rawCategories] = (await Promise.all([
    Product.find({}).sort({ id: -1 }).lean(),
    Category.find({}).sort({ name: 1 }).lean(),
  ])) as unknown as [RawProductDoc[], RawCategoryDoc[]];

  const products: StoreProduct[] = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    categoryId: p.categoryId,
    basePrice: p.basePrice,
    image: p.images?.[0] || '',
    variants: (p.variants || []).map((v) => ({
      year: v.year,
      price: v.price,
      stock: v.stock,
    })),
  }));

  const categories: StoreCategory[] = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <AdminShell
      title="Create In-Store Order"
      subtitle="Record walk-in store purchases, select item variants, collect payment, and automatically synchronize stock."
    >
      <CreateStoreOrderForm products={products} categories={categories} />
    </AdminShell>
  );
}
