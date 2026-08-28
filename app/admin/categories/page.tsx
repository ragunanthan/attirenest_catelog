import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Category from '@/lib/models/Category';
import Product from '@/lib/models/Product';
import { AdminShell } from '../components/AdminShell';
import { CategoriesManager, CategoryItem } from './CategoriesManager';

export const dynamic = 'force-dynamic';

interface RawCategoryDoc {
  id: string;
  name: string;
  description: string;
  theme: string;
}

interface ProductCountAgg {
  _id: string;
  count: number;
}

export default async function AdminCategoriesPage() {
  const session = await getSession();
  if (!session) {
    redirect('/admin');
  }

  await dbConnect();

  const [rawCategories, productCounts] = (await Promise.all([
    Category.find({}).lean(),
    Product.aggregate([{ $group: { _id: '$categoryId', count: { $sum: 1 } } }]),
  ])) as [RawCategoryDoc[], ProductCountAgg[]];

  const countMap = new Map(productCounts.map((pc) => [pc._id, pc.count]));

  const categories: CategoryItem[] = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    theme: c.theme || 'sage',
    productCount: countMap.get(c.id) || 0,
  }));

  return (
    <AdminShell
      title="Catalog Categories"
      subtitle="Manage sections displayed on your homepage catalogue navigation."
    >
      <CategoriesManager categories={categories} />
    </AdminShell>
  );
}
