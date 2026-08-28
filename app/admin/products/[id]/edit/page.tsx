import { getSession } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Category from '@/lib/models/Category';
import Product from '@/lib/models/Product';
import { AdminShell } from '../../../components/AdminShell';
import { ProductForm, ProductFormData, CategoryOption } from '../../../components/ProductForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface RawCategoryDoc {
  id: string;
  name: string;
}

interface RawVariantDoc {
  year: string;
  price: number;
  stock: number;
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
  variants?: RawVariantDoc[];
}

export default async function EditProductPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect('/admin');
  }

  const { id } = await params;
  const numericId = Number(id);

  if (isNaN(numericId)) {
    notFound();
  }

  await dbConnect();
  const [rawProduct, rawCategories] = (await Promise.all([
    Product.findOne({ id: numericId }).lean(),
    Category.find({}).lean(),
  ])) as unknown as [RawProductDoc | null, RawCategoryDoc[]];

  if (!rawProduct) {
    notFound();
  }

  const categories: CategoryOption[] = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const initialData: ProductFormData = {
    id: rawProduct.id,
    categoryId: rawProduct.categoryId,
    name: rawProduct.name,
    features: rawProduct.features,
    description: rawProduct.description,
    basePrice: rawProduct.basePrice,
    badge: rawProduct.badge,
    badgeBg: rawProduct.badgeBg,
    badgeColor: rawProduct.badgeColor,
    images: rawProduct.images || [],
    variants: (rawProduct.variants || []).map((v) => ({
      year: v.year,
      price: v.price,
      stock: v.stock,
    })),
  };

  return (
    <AdminShell
      title={`Edit: ${rawProduct.name}`}
      subtitle={`Product ID #${rawProduct.id} • Update stock, prices, photos, and descriptions.`}
    >
      <ProductForm categories={categories} initialData={initialData} isEditing={true} />
    </AdminShell>
  );
}
