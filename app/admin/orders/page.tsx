import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Order, { IOrder } from '@/lib/models/Order';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminOrders() {
  const session = await getSession();
  if (!session) {
    redirect('/admin');
  }

  await dbConnect();
  const orders = await Order.find({}).sort({ createdAt: -1 }).lean() as IOrder[];

  return (
    <div className="min-h-screen bg-[#FFF9F5] p-5 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-[36px] font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>Sales Orders</h1>
            <p className="text-[#6b6762]">Track and manage your customer payments.</p>
          </div>
          <Link href="/admin/dashboard" className="px-5 py-2.5 rounded-full bg-white border border-[#A8C3A5]/30 text-sm font-medium hover:bg-[#A8C3A5]/10 transition">
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_20px_60px_-30px_rgba(0,0,0,0.15)] border border-[#A8C3A5]/15">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#A8C3A5]/5 border-b border-[#A8C3A5]/10">
                  <th className="p-6 text-sm font-semibold text-[#4a4642]">Order Date</th>
                  <th className="p-6 text-sm font-semibold text-[#4a4642]">Customer</th>
                  <th className="p-6 text-sm font-semibold text-[#4a4642]">Items</th>
                  <th className="p-6 text-sm font-semibold text-[#4a4642]">Total</th>
                  <th className="p-6 text-sm font-semibold text-[#4a4642]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#A8C3A5]/10">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-[#9a938c] italic">No orders found yet.</td>
                  </tr>
                ) : (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  orders.map((order: any) => (
                    <tr key={order._id.toString()} className="hover:bg-[#A8C3A5]/5 transition">
                      <td className="p-6 text-sm text-[#4a4642]">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-6 text-sm text-[#4a4642]">
                        {order.shippingAddress ? (
                          <div>
                            <div className="font-medium">{order.shippingAddress.fullName}</div>
                            <div className="text-[#7a766f] text-xs mt-0.5">📞 {order.shippingAddress.phone}</div>
                            <div className="text-[#9a938c] text-xs mt-0.5">
                              {order.shippingAddress.addressLine1}{order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}
                              <br />
                              {order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#9a938c] italic">No info</span>
                        )}
                      </td>
                      <td className="p-6 text-sm text-[#4a4642]">
                        <div className="space-y-1">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex gap-2">
                              <span className="font-medium">{item.qty}x</span>
                              <span>{item.name} ({item.year}Y)</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-6 text-sm font-semibold text-[#2E2A27]">
                        ₹{order.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          order.status === 'paid' 
                            ? 'bg-green-100 text-green-600' 
                            : order.status === 'pending'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
