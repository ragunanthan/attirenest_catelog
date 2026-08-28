import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Category from '@/lib/models/Category';
import { AdminShell } from '../../components/AdminShell';
import { ProductForm, CategoryOption } from '../../components/ProductForm';

export const dynamic = 'force-dynamic';

interface RawCategoryDoc {
  id: string;
  name: string;
}

export default async function AddProductPage() {
  const session = await getSession();
  if (!session) {
    redirect('/admin');
  }

  await dbConnect();
  const rawCategories = (await Category.find({}).lean()) as unknown as RawCategoryDoc[];

  const categories: CategoryOption[] = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <AdminShell
      title="Add New Product"
      subtitle="Create a new children's clothing piece with photos, age variants, and stock."
    >
      <ProductForm categories={categories} />
    </AdminShell>
  );
}
