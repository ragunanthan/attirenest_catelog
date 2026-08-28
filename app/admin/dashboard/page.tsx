import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import Category from '@/lib/models/Category';
import { AdminShell } from '../components/AdminShell';
import Link from 'next/link';
import {
  IndianRupee,
  ShoppingBag,
  Package,
  AlertTriangle,
  Plus,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Edit,
  FolderKanban,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface VariantDoc {
  year: string;
  price: number;
  stock: number;
}

interface ProductDoc {
  id: number;
  name: string;
  images?: string[];
  variants?: VariantDoc[];
}

interface OrderDoc {
  _id: { toString(): string };
  orderNumber: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  createdAt: string | Date;
  shippingAddress?: {
    fullName?: string;
  };
  items?: Array<{ name: string; qty: number }>;
}

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/admin');
  }

  await dbConnect();

  // Fetch metrics in parallel
  const [rawProducts, rawOrders, categoryCount] = await Promise.all([
    Product.find({}).sort({ id: -1 }).lean() as unknown as ProductDoc[],
    Order.find({}).sort({ createdAt: -1 }).lean() as unknown as OrderDoc[],
    Category.countDocuments({}),
  ]);

  // Aggregate Metrics
  const totalProducts = rawProducts.length;
  const totalVariants = rawProducts.reduce(
    (sum, p) => sum + (p.variants?.length || 0),
    0
  );

  const paidOrders = rawOrders.filter((o) => o.status === 'paid');
  const pendingOrders = rawOrders.filter((o) => o.status === 'pending');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.amount, 0);

  // Find Low Stock Variants (<= 3 items)
  interface LowStockItem {
    productId: number;
    productName: string;
    image?: string;
    year: string;
    stock: number;
    price: number;
  }
  const lowStockItems: LowStockItem[] = [];

  rawProducts.forEach((p) => {
    p.variants?.forEach((v) => {
      if (v.stock <= 3) {
        lowStockItems.push({
          productId: p.id,
          productName: p.name,
          image: p.images?.[0],
          year: v.year,
          stock: v.stock,
          price: v.price,
        });
      }
    });
  });

  const recentOrders = rawOrders.slice(0, 5);

  return (
    <AdminShell
      title="Executive Dashboard"
      subtitle="Real-time performance metrics, catalog stock health, and recent sales."
      actions={
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#5A7A56] hover:bg-[#486345] text-white text-xs font-bold shadow-md shadow-[#5A7A56]/20 transition"
        >
          <Plus size={16} /> Add Product
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Row 1: KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Revenue */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs flex flex-col justify-between group hover:border-[#5A7A56]/40 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8C8479] uppercase tracking-wider">
                Total Revenue
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <IndianRupee size={20} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl lg:text-3xl font-extrabold text-[#2E2A27]">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-[#7A7367] mt-1 flex items-center gap-1">
                <span className="text-emerald-700 font-bold">{paidOrders.length}</span> settled orders
              </p>
            </div>
          </div>

          {/* Orders */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs flex flex-col justify-between group hover:border-[#5A7A56]/40 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8C8479] uppercase tracking-wider">
                Order Volume
              </span>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <ShoppingBag size={20} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl lg:text-3xl font-extrabold text-[#2E2A27]">
                {rawOrders.length}
              </div>
              <p className="text-xs text-[#7A7367] mt-1 flex items-center gap-1.5">
                <span className="text-amber-700 font-semibold">{pendingOrders.length} pending</span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold">{paidOrders.length} paid</span>
              </p>
            </div>
          </div>

          {/* Active Products */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs flex flex-col justify-between group hover:border-[#5A7A56]/40 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8C8479] uppercase tracking-wider">
                Active Catalog
              </span>
              <div className="w-10 h-10 rounded-2xl bg-[#5A7A56]/10 text-[#5A7A56] flex items-center justify-center font-bold">
                <Package size={20} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl lg:text-3xl font-extrabold text-[#2E2A27]">
                {totalProducts}
              </div>
              <p className="text-xs text-[#7A7367] mt-1">
                In <strong>{categoryCount}</strong> categories ({totalVariants} sizes)
              </p>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs flex flex-col justify-between group hover:border-amber-400 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8C8479] uppercase tracking-wider">
                Low Stock Alerts
              </span>
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                  lowStockItems.length > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                <AlertTriangle size={20} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl lg:text-3xl font-extrabold text-[#2E2A27]">
                {lowStockItems.length}
              </div>
              <p className="text-xs text-[#7A7367] mt-1">
                {lowStockItems.length > 0 ? 'Variants need restock' : 'All stocks healthy'}
              </p>
            </div>
          </div>
        </div>

        {/* Row 2: Quick Navigation Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Link
            href="/admin/products/new"
            className="p-6 rounded-3xl bg-gradient-to-br from-[#5A7A56] to-[#3E5C3B] text-white shadow-md shadow-[#5A7A56]/20 flex items-center justify-between group hover:scale-[1.01] transition-all"
          >
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-100/80 mb-1">
                Catalog
              </div>
              <div className="text-base font-bold" style={{ fontFamily: "'Fraunces', serif" }}>
                + Add Product
              </div>
              <p className="text-[11px] text-emerald-100/90 mt-1">
                Photos, sizes & pricing.
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white group-hover:translate-x-1 transition-transform">
              <ArrowRight size={18} />
            </div>
          </Link>

          <Link
            href="/admin/products"
            className="p-6 rounded-3xl bg-white border border-[#E8E2D9] shadow-xs flex items-center justify-between group hover:border-[#5A7A56] hover:scale-[1.01] transition-all"
          >
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#8C8479] mb-1">
                Inventory
              </div>
              <div className="text-base font-bold text-[#2E2A27]" style={{ fontFamily: "'Fraunces', serif" }}>
                Products ({totalProducts})
              </div>
              <p className="text-[11px] text-[#7A7367] mt-1">
                Edit items, stock & search.
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] flex items-center justify-center text-[#5A7A56] group-hover:translate-x-1 transition-transform">
              <ArrowRight size={18} />
            </div>
          </Link>

          <Link
            href="/admin/categories"
            className="p-6 rounded-3xl bg-white border border-[#E8E2D9] shadow-xs flex items-center justify-between group hover:border-[#5A7A56] hover:scale-[1.01] transition-all"
          >
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#8C8479] mb-1">
                Sections
              </div>
              <div className="text-base font-bold text-[#2E2A27]" style={{ fontFamily: "'Fraunces', serif" }}>
                Categories ({categoryCount})
              </div>
              <p className="text-[11px] text-[#7A7367] mt-1">
                Add, edit & safe delete.
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] flex items-center justify-center text-[#5A7A56] group-hover:translate-x-1 transition-transform">
              <FolderKanban size={18} />
            </div>
          </Link>

          <Link
            href="/admin/orders"
            className="p-6 rounded-3xl bg-white border border-[#E8E2D9] shadow-xs flex items-center justify-between group hover:border-[#5A7A56] hover:scale-[1.01] transition-all"
          >
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#8C8479] mb-1">
                Fulfillment
              </div>
              <div className="text-base font-bold text-[#2E2A27]" style={{ fontFamily: "'Fraunces', serif" }}>
                Sales Orders
              </div>
              <p className="text-[11px] text-[#7A7367] mt-1">
                Address & WhatsApp contact.
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] flex items-center justify-center text-[#5A7A56] group-hover:translate-x-1 transition-transform">
              <ShoppingBag size={18} />
            </div>
          </Link>
        </div>

        {/* Row 3: Recent Orders & Stock Warnings */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Orders (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E8E2D9] p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
              <div>
                <h3
                  className="text-lg font-bold text-[#2E2A27]"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  Recent Sales Orders
                </h3>
                <p className="text-xs text-[#7A7367]">Latest customer orders and payments</p>
              </div>
              <Link
                href="/admin/orders"
                className="text-xs font-bold text-[#5A7A56] hover:underline flex items-center gap-1"
              >
                View All <ChevronRight size={14} />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-10 text-center text-[#8C8479] text-xs">
                No orders placed yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order._id.toString()}
                    className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-[#2E2A27] flex items-center gap-2">
                        <span>{order.orderNumber}</span>
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            order.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-[#7A7367] truncate mt-0.5">
                        {order.shippingAddress?.fullName || 'Anonymous Customer'} • {order.items?.length || 0} items
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-extrabold text-[#2E2A27]">
                        ₹{order.amount.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-[#8C8479]">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock Warning Alert (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E8E2D9] p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
              <div>
                <h3
                  className="text-lg font-bold text-[#2E2A27] flex items-center gap-2"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  <AlertTriangle size={18} className="text-amber-600" />
                  Stock Health
                </h3>
                <p className="text-xs text-[#7A7367]">Variants with 3 or fewer items left</p>
              </div>
              <Link
                href="/admin/products"
                className="text-xs font-bold text-[#5A7A56] hover:underline flex items-center gap-1"
              >
                Inventory <ChevronRight size={14} />
              </Link>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="py-12 text-center text-[#8C8479]">
                <CheckCircle2 size={32} className="text-emerald-600 mx-auto mb-2" />
                <p className="font-bold text-sm text-[#2E2A27]">All Inventory Healthy</p>
                <p className="text-xs text-[#7A7367] mt-1">
                  No items currently below low stock thresholds.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {lowStockItems.slice(0, 6).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-[#2E2A27] truncate">
                        {item.productName}
                      </div>
                      <div className="text-[#7A7367] mt-0.5">
                        Age: <strong>{item.year}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-lg text-[10px] ${
                          item.stock === 0
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.stock === 0 ? 'SOLD OUT' : `${item.stock} left`}
                      </span>

                      <Link
                        href={`/admin/products/${item.productId}/edit`}
                        className="p-1.5 rounded-lg text-[#5A7A56] hover:bg-[#5A7A56]/15 transition"
                        title="Restock product"
                      >
                        <Edit size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
