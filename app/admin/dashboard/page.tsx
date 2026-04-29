import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Category from '@/lib/models/Category';
import Product from '@/lib/models/Product';
import AddProductForm from './AddProductForm';
import ProductList from './ProductList';
import { logoutAction } from '../actions';
import Link from 'next/link';

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session) {
    redirect('/admin');
  }

  await dbConnect();
  const [categories, products] = await Promise.all([
    Category.find({}).lean(),
    Product.find({}).sort({ id: -1 }).lean()
  ]);
  
  // Convert ObjectIds to strings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeCategories = categories.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeProducts = products.map((prod: any) => ({
    id: prod.id,
    categoryId: prod.categoryId,
    name: prod.name,
    features: prod.features,
    description: prod.description,
    basePrice: prod.basePrice,
    badge: prod.badge,
    badgeBg: prod.badgeBg,
    badgeColor: prod.badgeColor,
    image: prod.image,
    variants: (prod.variants || []).map((v: { year: number; price: number; stock: number }) => ({
      year: v.year,
      price: v.price,
      stock: v.stock,
    })),
  }));

  return (
    <div className="min-h-screen bg-[#FFF9F5] p-5 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h1 className="text-[36px] font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>Admin Dashboard</h1>
            <p className="text-[#6b6762]">Welcome back! Manage your products below.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="px-5 py-2.5 rounded-full border border-[#A8C3A5]/30 bg-white text-sm font-medium hover:bg-[#A8C3A5]/10 transition">View Site</Link>
            <Link href="/admin/orders" className="px-5 py-2.5 rounded-full border border-[#A8C3A5]/30 bg-white text-sm font-medium hover:bg-[#A8C3A5]/10 transition">View Orders</Link>
            <form action={logoutAction}>
              <button type="submit" className="px-5 py-2.5 rounded-full bg-[#2E2A27] text-white text-sm font-medium hover:opacity-90 transition">Logout</button>
            </form>
          </div>
        </div>

        <div className="grid gap-8">
          <div className="bg-white rounded-[32px] p-8 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.15)] border border-[#A8C3A5]/15">
            <h2 className="text-[24px] font-semibold mb-6" style={{ fontFamily: "'Fraunces', serif" }}>Add New Product</h2>
            <AddProductForm categories={safeCategories} />
          </div>

          <div className="bg-white rounded-[32px] p-8 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.15)] border border-[#A8C3A5]/15">
            <ProductList products={safeProducts} categories={safeCategories} />
          </div>
        </div>
      </div>
    </div>
  );
}
