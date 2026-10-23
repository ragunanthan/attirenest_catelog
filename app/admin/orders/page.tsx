import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import { AdminShell } from '../components/AdminShell';
import { OrdersTable, OrderItem } from './OrdersTable';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface RawOrderItem {
  productId: number;
  name: string;
  year: string;
  price: number;
  qty: number;
}

interface RawOrderDoc {
  _id: { toString(): string };
  orderId: string;
  orderNumber: string;
  paymentId?: string;
  paymentMethod?: string;
  paymentError?: string;
  amount: number;
  currency?: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  orderType?: 'online' | 'in_store';
  notes?: string;
  items?: RawOrderItem[];
  shippingAddress?: {
    fullName?: string;
    email?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  createdAt?: string | Date;
}

export default async function AdminOrdersPage() {
  const session = await getSession();
  if (!session) {
    redirect('/admin');
  }

  await dbConnect();
  const rawOrders = (await Order.find({}).sort({ createdAt: -1 }).lean()) as unknown as RawOrderDoc[];

  const orders: OrderItem[] = rawOrders.map((o) => ({
    _id: o._id.toString(),
    orderId: o.orderId,
    orderNumber: o.orderNumber,
    paymentId: o.paymentId,
    paymentMethod: o.paymentMethod,
    paymentError: o.paymentError,
    amount: o.amount,
    currency: o.currency || 'INR',
    status: o.status,
    orderType: o.orderType || 'online',
    notes: o.notes || '',
    items: (o.items || []).map((i) => ({
      productId: i.productId,
      name: i.name,
      year: i.year,
      price: i.price,
      qty: i.qty,
    })),
    shippingAddress: {
      fullName: o.shippingAddress?.fullName || '',
      email: o.shippingAddress?.email || '',
      phone: o.shippingAddress?.phone || '',
      addressLine1: o.shippingAddress?.addressLine1 || '',
      addressLine2: o.shippingAddress?.addressLine2 || '',
      city: o.shippingAddress?.city || '',
      state: o.shippingAddress?.state || '',
      pincode: o.shippingAddress?.pincode || '',
    },
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
  }));

  return (
    <AdminShell
      title="Sales Orders"
      subtitle="Track incoming payments, record in-store counter purchases, and manage delivery orders."
      actions={
        <Link
          href="/admin/orders/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#5A7A56] hover:bg-[#486345] text-white text-xs font-bold shadow-md shadow-[#5A7A56]/20 transition cursor-pointer"
        >
          <Plus size={16} /> Add In-Store Order
        </Link>
      }
    >
      <OrdersTable orders={orders} />
    </AdminShell>
  );
}
