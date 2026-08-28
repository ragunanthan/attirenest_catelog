'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Phone,
  MessageSquare,
  Calendar,
  IndianRupee,
  ShoppingBag,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface OrderItem {
  _id: string;
  orderId: string;
  orderNumber: string;
  paymentId?: string;
  paymentMethod?: string;
  paymentError?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  items: {
    productId: number;
    name: string;
    year: string;
    price: number;
    qty: number;
  }[];
  shippingAddress: {
    fullName: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  createdAt: string;
}

interface OrdersTableProps {
  orders: OrderItem[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'failed' | 'cancelled'>('all');
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.orderId.toLowerCase().includes(q) ||
        (order.paymentId && order.paymentId.toLowerCase().includes(q)) ||
        (order.shippingAddress?.fullName && order.shippingAddress.fullName.toLowerCase().includes(q)) ||
        (order.shippingAddress?.phone && order.shippingAddress.phone.includes(q)) ||
        (order.shippingAddress?.city && order.shippingAddress.city.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'all' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Metrics
  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status === 'paid')
      .reduce((sum, o) => sum + o.amount, 0);
  }, [orders]);

  const paidCount = useMemo(() => {
    return orders.filter((o) => o.status === 'paid').length;
  }, [orders]);

  const pendingCount = useMemo(() => {
    return orders.filter((o) => o.status === 'pending').length;
  }, [orders]);

  const getCleanPhone = (phone: string) => {
    return phone ? phone.replace(/\D/g, '').slice(-10) : '';
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <IndianRupee size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#8C8479] uppercase tracking-wider">
              Paid Sales Revenue
            </div>
            <div className="text-xl font-extrabold text-[#2E2A27]">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#8C8479] uppercase tracking-wider">
              Completed Orders
            </div>
            <div className="text-xl font-extrabold text-[#2E2A27]">{paidCount}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Clock size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#8C8479] uppercase tracking-wider">
              Pending Orders
            </div>
            <div className="text-xl font-extrabold text-[#2E2A27]">{pendingCount}</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8E2D9] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8479]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone, order ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#DCD6CC] text-xs font-medium text-[#2E2A27] focus:outline-none focus:border-[#5A7A56] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8C8479] hover:text-[#2E2A27]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {(['all', 'paid', 'pending', 'failed', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                statusFilter === status
                  ? 'bg-[#5A7A56] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#5C564E] hover:bg-[#E8E2D9]'
              }`}
            >
              {status === 'all' ? 'All Orders' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Count */}
      <div className="flex items-center justify-between text-xs font-medium text-[#7A7367] px-2">
        <span>
          Showing <strong>{filteredOrders.length}</strong> of <strong>{orders.length}</strong> orders
        </span>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E8E2D9] p-12 text-center text-[#8C8479]">
            <div className="w-12 h-12 rounded-full bg-[#FAF7F2] flex items-center justify-center mx-auto mb-3 text-[#A39B8F]">
              <ShoppingBag size={24} />
            </div>
            <p className="font-semibold text-[#2E2A27]">No orders found</p>
            <p className="text-xs text-[#8C8479] mt-1">
              Try changing the search query or status filter.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const cleanPhone = getCleanPhone(order.shippingAddress?.phone || '');
            const isExpanded = !!expandedOrders[order._id];
            const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={order._id}
                className="bg-white rounded-3xl border border-[#E8E2D9] shadow-xs overflow-hidden transition-all duration-200 hover:border-[#DCD6CC]"
              >
                {/* Order Header Summary Bar */}
                <div className="p-5 sm:p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left info: Order ID & Date */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] flex items-center justify-center text-[#5A7A56] shrink-0 font-bold">
                      <ShoppingBag size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-base text-[#2E2A27]">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
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
                      <div className="flex items-center gap-3 text-xs text-[#7A7367] mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {dateStr}
                        </span>
                        <span>•</span>
                        <span>{order.items?.length || 0} item(s)</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Customer & Contact Info */}
                  <div className="flex items-center gap-4 flex-wrap">
                    {order.shippingAddress && (
                      <div className="text-xs">
                        <div className="font-bold text-[#2E2A27]">
                          {order.shippingAddress.fullName}
                        </div>
                        <div className="text-[#7A7367] flex items-center gap-1.5 mt-0.5">
                          <span>📞 {order.shippingAddress.phone}</span>
                          {cleanPhone && (
                            <div className="flex items-center gap-1">
                              <a
                                href={`https://wa.me/91${cleanPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[10px]"
                                title="Chat on WhatsApp"
                              >
                                <MessageSquare size={10} /> WhatsApp
                              </a>
                              <a
                                href={`tel:${cleanPhone}`}
                                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#5C564E] hover:bg-[#E8E2D9] font-semibold text-[10px]"
                                title="Call phone"
                              >
                                <Phone size={10} /> Call
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Amount & Expand Toggle */}
                  <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-[#E8E2D9]/60">
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-[#8C8479] uppercase">
                        Total Amount
                      </div>
                      <div className="text-lg font-extrabold text-[#2E2A27]">
                        ₹{order.amount.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <button
                      onClick={() => toggleExpand(order._id)}
                      className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#E8E2D9] text-xs font-semibold text-[#4A443B] flex items-center gap-1 transition cursor-pointer"
                    >
                      {isExpanded ? (
                        <>
                          Hide Details <ChevronUp size={14} />
                        </>
                      ) : (
                        <>
                          View Details <ChevronDown size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="border-t border-[#E8E2D9] bg-[#FAF7F2]/60 p-5 sm:p-7 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-200">
                    {/* Items List */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-[#8C8479] uppercase tracking-wider">
                        Ordered Items
                      </div>
                      <div className="space-y-2">
                        {order.items?.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-3 rounded-2xl border border-[#E8E2D9] flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-[#2E2A27]">
                                {item.name}
                              </div>
                              <div className="text-[11px] text-[#7A7367]">
                                Age Size: <strong>{item.year}</strong> • Qty: <strong>{item.qty}</strong>
                              </div>
                            </div>
                            <div className="font-extrabold text-sm text-[#2E2A27]">
                              ₹{(item.price * item.qty).toLocaleString('en-IN')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Address & Razorpay Audit */}
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs font-bold text-[#8C8479] uppercase tracking-wider mb-2">
                          Delivery Address
                        </div>
                        <div className="bg-white p-3.5 rounded-2xl border border-[#E8E2D9] text-xs text-[#4A443B] space-y-1">
                          <div className="font-bold text-[#2E2A27]">
                            {order.shippingAddress?.fullName}
                          </div>
                          <div>{order.shippingAddress?.addressLine1}</div>
                          {order.shippingAddress?.addressLine2 && (
                            <div>{order.shippingAddress.addressLine2}</div>
                          )}
                          <div>
                            {order.shippingAddress?.city}, {order.shippingAddress?.state} -{' '}
                            <strong>{order.shippingAddress?.pincode}</strong>
                          </div>
                          <div className="text-[#7A7367] pt-1">
                            Email: {order.shippingAddress?.email || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Payment Metadata */}
                      <div>
                        <div className="text-xs font-bold text-[#8C8479] uppercase tracking-wider mb-2">
                          Payment & Gateway Audit
                        </div>
                        <div className="bg-white p-3.5 rounded-2xl border border-[#E8E2D9] text-xs text-[#5C564E] space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-[#8C8479]">Razorpay Order ID:</span>
                            <span className="font-mono font-medium">{order.orderId}</span>
                          </div>
                          {order.paymentId && (
                            <div className="flex justify-between">
                              <span className="text-[#8C8479]">Razorpay Payment ID:</span>
                              <span className="font-mono font-bold text-emerald-700">
                                {order.paymentId}
                              </span>
                            </div>
                          )}
                          {order.paymentMethod && (
                            <div className="flex justify-between">
                              <span className="text-[#8C8479]">Payment Method:</span>
                              <span className="capitalize font-semibold">{order.paymentMethod}</span>
                            </div>
                          )}
                          {order.paymentError && (
                            <div className="text-red-600 bg-red-50 p-2 rounded-lg mt-1">
                              <strong>Failure Reason:</strong> {order.paymentError}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
