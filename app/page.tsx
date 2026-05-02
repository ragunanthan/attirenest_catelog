import Catalogue from './components/Catalogue';
import dbConnect from '@/lib/mongodb';
import Category from '@/lib/models/Category';
import Product from '@/lib/models/Product';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '@/lib/seedData';

// Ensure the page is dynamically rendered to reflect database changes
export const dynamic = 'force-dynamic';

interface LeanCategory {
  id: string;
  name: string;
  description: string;
  theme: string;
}

interface LeanProduct {
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
  variants?: Array<{
    year: string;
    price: number;
    stock: number;
  }>;
}

export default async function Home() {
  await dbConnect();
  
  let categories = await Category.find({}).lean() as unknown as LeanCategory[];
  let products = await Product.find({}).sort({ id: 1 }).lean() as unknown as LeanProduct[];
  
  // Seed database if empty
  if (categories.length === 0) {
    await Category.insertMany(MOCK_CATEGORIES);
    categories = await Category.find({}).lean() as unknown as LeanCategory[];
  }
  
  if (products.length === 0) {
    await Product.insertMany(MOCK_PRODUCTS);
    products = await Product.find({}).sort({ id: 1 }).lean() as unknown as LeanProduct[];
  }

  // Sanitize the objects to ensure they are plain objects
  const safeCategories = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    theme: cat.theme,
  }));

  const safeProducts = products.map((prod) => ({
    id: prod.id,
    categoryId: prod.categoryId,
    name: prod.name,
    features: prod.features,
    description: prod.description,
    basePrice: prod.basePrice,
    badge: prod.badge || undefined,
    badgeBg: prod.badgeBg || undefined,
    badgeColor: prod.badgeColor || undefined,
    images: prod.images || [],
    variants: prod.variants ? prod.variants.map((v) => ({
      year: String(v.year),
      price: v.price,
      stock: v.stock
    })) : []
  }));

  return (
    <main>
      <Catalogue initialCategories={safeCategories} initialProducts={safeProducts} />
    </main>
  );
}
