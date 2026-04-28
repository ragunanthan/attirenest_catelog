import Catalogue from './components/Catalogue';
import dbConnect from '@/lib/mongodb';
import Category from '@/lib/models/Category';
import Product from '@/lib/models/Product';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '@/lib/seedData';

// Ensure the page is dynamically rendered to reflect database changes
export const dynamic = 'force-dynamic';

export default async function Home() {
  await dbConnect();
  
  let categories = await Category.find({}).lean();
  let products = await Product.find({}).sort({ id: 1 }).lean();
  
  // Seed database if empty
  if (categories.length === 0) {
    await Category.insertMany(MOCK_CATEGORIES);
    categories = await Category.find({}).lean();
  }
  
  if (products.length === 0) {
    await Product.insertMany(MOCK_PRODUCTS);
    products = await Product.find({}).sort({ id: 1 }).lean();
  }

  // Sanitize the objects to ensure they are plain objects (removing Mongoose Document specifics like _id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeCategories = categories.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    theme: cat.theme,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeProducts = products.map((prod: any) => ({
    id: prod.id,
    categoryId: prod.categoryId,
    name: prod.name,
    features: prod.features,
    description: prod.description,
    basePrice: prod.basePrice,
    ageRange: prod.ageRange,
    badge: prod.badge || undefined,
    badgeBg: prod.badgeBg || undefined,
    badgeColor: prod.badgeColor || undefined,
    image: prod.image,
  }));

  return (
    <main>
      <Catalogue initialCategories={safeCategories} initialProducts={safeProducts} />
    </main>
  );
}
