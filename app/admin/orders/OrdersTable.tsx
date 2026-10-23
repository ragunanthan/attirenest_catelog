'use client';

import { useState, useMemo, useTransition } from 'react';
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
  Store,
  Globe,
  Printer,
  FileText,
  AlertCircle,
  Ban,
  Check,
} from 'lucide-react';
import { OrderReceiptModal, ReceiptData } from '../components/OrderReceiptModal';
import { updateOrderStatusAction } from '../actions';

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
  orderType?: 'online' | 'in_store';
  notes?: string;
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
  const [channelFilter, setChannelFilter] = useState<'all' | 'in_store' | 'online'>('all');
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [receiptToPrint, setReceiptToPrint] = useState<ReceiptData | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isUpdatingStatus, startStatusTransition] = useTransition();

  const toggleExpand = (id: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleStatusUpdate = (orderId: string, newStatus: 'paid' | 'pending' | 'cancelled') => {
    if (!confirm(`Are you sure you want to mark this order as "${newStatus}"?`)) {
      return;
    }

    startStatusTransition(async () => {
      const res = await updateOrderStatusAction(orderId, newStatus);
      if (res.error) {
        setStatusMessage(`Error: ${res.error}`);
      } else if (res.success) {
        setStatusMessage(res.success);
        setTimeout(() => setStatusMessage(null), 4000);
      }
    });
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

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      const orderType = order.orderType || 'online';
      const matchesChannel =
        channelFilter === 'all' ||
        (channelFilter === 'in_store' && orderType === 'in_store') ||
        (channelFilter === 'online' && orderType !== 'in_store');

      return matchesSearch && matchesStatus && matchesChannel;
    });
  }, [orders, searchQuery, statusFilter, channelFilter]);

  // Metrics
  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status === 'paid')
      .reduce((sum, o) => sum + o.amount, 0);
  }, [orders]);

  const inStoreOrders = useMemo(() => {
    return orders.filter((o) => o.orderType === 'in_store');
  }, [orders]);

  const inStorePaidRevenue = useMemo(() => {
    return inStoreOrders
      .filter((o) => o.status === 'paid')
      .reduce((sum, o) => sum + o.amount, 0);
  }, [inStoreOrders]);

  const onlineOrders = useMemo(() => {
    return orders.filter((o) => o.orderType !== 'in_store');
  }, [orders]);

  const onlinePaidRevenue = useMemo(() => {
    return onlineOrders
      .filter((o) => o.status === 'paid')
      .reduce((sum, o) => sum + o.amount, 0);
  }, [onlineOrders]);

  const pendingCount = useMemo(() => {
    return orders.filter((o) => o.status === 'pending').length;
  }, [orders]);

  const getCleanPhone = (phone: string) => {
    return phone ? phone.replace(/\D/g, '').slice(-10) : '';
  };

  const openReceiptModal = (order: OrderItem) => {
    setReceiptToPrint({
      orderNumber: order.orderNumber,
      orderId: order.orderId,
      orderType: order.orderType || 'online',
      createdAt: order.createdAt,
      amount: order.amount,
      paymentMethod: order.paymentMethod,
      paymentId: order.paymentId,
      customerName: order.shippingAddress?.fullName || 'Walk-in Customer',
      customerPhone: order.shippingAddress?.phone || '',
      customerEmail: order.shippingAddress?.email || '',
      addressLine1: order.shippingAddress?.addressLine1,
      city: order.shippingAddress?.city,
      notes: order.notes,
      items: order.items.map((i) => ({
        name: i.name,
        year: i.year,
        price: i.price,
        qty: i.qty,
      })),
    });
  };

  return (
    <div className="space-y-6">
      {/* Status notification toast */}
      {statusMessage && (
        <div className="p-4 rounded-2xl bg-[#5A7A56] text-white text-xs font-bold shadow-md animate-in fade-in flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Top Metrics Cards (4 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Paid Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <IndianRupee size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#8C8479] uppercase tracking-wider">
              Total Settled Revenue
            </div>
            <div className="text-xl font-extrabold text-[#2E2A27]">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* In-Store POS Sales */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Store size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#8C8479] uppercase tracking-wider">
              In-Store Counter Sales
            </div>
            <div className="text-xl font-extrabold text-[#2E2A27]">
              ₹{inStorePaidRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-[#7A7367]">
              {inStoreOrders.length} order(s)
            </div>
          </div>
        </div>

        {/* Online Orders */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Globe size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#8C8479] uppercase tracking-wider">
              Online Razorpay
            </div>
            <div className="text-xl font-extrabold text-[#2E2A27]">
              ₹{onlinePaidRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-[#7A7367]">
              {onlineOrders.length} order(s)
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Clock size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#8C8479] uppercase tracking-wider">
              Pending Orders
            </div>
            <div className="text-xl font-extrabold text-[#2E2A27]">{pendingCount}</div>
            <div className="text-[10px] text-[#7A7367]">Awaiting confirmation</div>
          </div>
        </div>
      </div>

      {/* Search & Multi-Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8E2D9] shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full lg:w-96">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8479]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone, order #..."
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

        {/* Filters Group (Channel + Status) */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Channel Filters */}
          <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-2xl border border-[#E8E2D9]">
            <button
              onClick={() => setChannelFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                channelFilter === 'all'
                  ? 'bg-white text-[#2E2A27] shadow-xs'
                  : 'text-[#7A7367] hover:text-[#2E2A27]'
              }`}
            >
              All Channels
            </button>
            <button
              onClick={() => setChannelFilter('in_store')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                channelFilter === 'in_store'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-[#7A7367] hover:text-[#2E2A27]'
              }`}
            >
              <Store size={12} /> In-Store ({inStoreOrders.length})
            </button>
            <button
              onClick={() => setChannelFilter('online')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                channelFilter === 'online'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-[#7A7367] hover:text-[#2E2A27]'
              }`}
            >
              <Globe size={12} /> Online ({onlineOrders.length})
            </button>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1">
            {(['all', 'paid', 'pending', 'failed', 'cancelled'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                  statusFilter === status
                    ? 'bg-[#5A7A56] text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-[#5C564E] hover:bg-[#E8E2D9]'
                }`}
              >
                {status === 'all' ? 'All Status' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Count Indicator */}
      <div className="flex items-center justify-between text-xs font-medium text-[#7A7367] px-2">
        <span>
          Showing <strong>{filteredOrders.length}</strong> of <strong>{orders.length}</strong> orders
        </span>
      </div>

      {/* Orders List Cards */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E8E2D9] p-12 text-center text-[#8C8479]">
            <div className="w-12 h-12 rounded-full bg-[#FAF7F2] flex items-center justify-center mx-auto mb-3 text-[#A39B8F]">
              <ShoppingBag size={24} />
            </div>
            <p className="font-semibold text-[#2E2A27]">No orders found</p>
            <p className="text-xs text-[#8C8479] mt-1">
              Try changing your search query, channel filter, or status filter.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const cleanPhone = getCleanPhone(order.shippingAddress?.phone || '');
            const isExpanded = !!expandedOrders[order._id];
            const isInStore = order.orderType === 'in_store';
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
                className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden ${
                  isInStore ? 'border-purple-200 hover:border-purple-300' : 'border-[#E8E2D9] hover:border-[#DCD6CC]'
                } shadow-xs`}
              >
                {/* Order Header Summary Bar */}
                <div className="p-5 sm:p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left info: Channel Icon, Order ID & Date */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                        isInStore
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-[#FAF7F2] text-[#5A7A56] border border-[#E8E2D9]'
                      }`}
                    >
                      {isInStore ? <Store size={18} /> : <ShoppingBag size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-base text-[#2E2A27]">
                          {order.orderNumber}
                        </span>

                        {/* Order Channel Badge */}
                        {isInStore ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
                            <Store size={10} /> In-Store POS
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 flex items-center gap-1">
                            <Globe size={10} /> Online
                          </span>
                        )}

                        {/* Order Status Badge */}
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
                        {order.paymentMethod && (
                          <>
                            <span>•</span>
                            <span className="font-semibold uppercase text-[#5C564E]">
                              {order.paymentMethod}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle Customer & Contact Info */}
                  <div className="flex items-center gap-4 flex-wrap">
                    {order.shippingAddress && (
                      <div className="text-xs">
                        <div className="font-bold text-[#2E2A27]">
                          {order.shippingAddress.fullName || 'Walk-in Customer'}
                        </div>
                        <div className="text-[#7A7367] flex items-center gap-1.5 mt-0.5">
                          {order.shippingAddress.phone ? (
                            <>
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
                            </>
                          ) : (
                            <span className="text-[#8C8479]">In-store counter buyer</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Amount, Print Receipt & Expand Toggle */}
                  <div className="flex items-center justify-between md:justify-end gap-3.5 pt-3 md:pt-0 border-t md:border-t-0 border-[#E8E2D9]/60">
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-[#8C8479] uppercase">
                        Total Amount
                      </div>
                      <div className="text-lg font-extrabold text-[#2E2A27]">
                        ₹{order.amount.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <button
                      onClick={() => openReceiptModal(order)}
                      className="p-2 rounded-xl bg-[#FAF7F2] hover:bg-[#E8E2D9] text-[#4A443B] transition cursor-pointer"
                      title="Print Order Receipt"
                    >
                      <Printer size={16} />
                    </button>

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
                              <div className="font-bold text-[#2E2A27]">{item.name}</div>
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

                      {/* Staff Notes if present */}
                      {order.notes && (
                        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-[#5C564E]">
                          <div className="font-bold text-amber-800 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1">
                            <FileText size={12} /> Staff / Internal Notes
                          </div>
                          <div>{order.notes}</div>
                        </div>
                      )}
                    </div>

                    {/* Shipping Address & Payment Metadata */}
                    <div className="space-y-4">
                      {/* Delivery / Pickup Address */}
                      <div>
                        <div className="text-xs font-bold text-[#8C8479] uppercase tracking-wider mb-2">
                          {isInStore ? 'Order Fulfillment / Customer' : 'Delivery Address'}
                        </div>
                        <div className="bg-white p-3.5 rounded-2xl border border-[#E8E2D9] text-xs text-[#4A443B] space-y-1">
                          <div className="font-bold text-[#2E2A27]">
                            {order.shippingAddress?.fullName || 'Walk-in Customer'}
                          </div>
                          <div>{order.shippingAddress?.addressLine1 || 'In-Store Counter Pickup'}</div>
                          {order.shippingAddress?.addressLine2 && (
                            <div>{order.shippingAddress.addressLine2}</div>
                          )}
                          {order.shippingAddress?.city && (
                            <div>
                              {order.shippingAddress.city}
                              {order.shippingAddress?.pincode && ` - ${order.shippingAddress.pincode}`}
                            </div>
                          )}
                          {order.shippingAddress?.email && (
                            <div className="text-[#7A7367] pt-1">
                              Email: {order.shippingAddress.email}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payment & Audit */}
                      <div>
                        <div className="text-xs font-bold text-[#8C8479] uppercase tracking-wider mb-2">
                          Payment & Billing Details
                        </div>
                        <div className="bg-white p-3.5 rounded-2xl border border-[#E8E2D9] text-xs text-[#5C564E] space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-[#8C8479]">Order Channel:</span>
                            <span className="font-semibold">
                              {isInStore ? '🏬 In-Store Counter Sale' : '🌐 Online E-Commerce'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#8C8479]">Order / Tracking ID:</span>
                            <span className="font-mono font-medium">{order.orderId}</span>
                          </div>
                          {order.paymentId && (
                            <div className="flex justify-between">
                              <span className="text-[#8C8479]">Payment Reference / ID:</span>
                              <span className="font-mono font-bold text-emerald-700">
                                {order.paymentId}
                              </span>
                            </div>
                          )}
                          {order.paymentMethod && (
                            <div className="flex justify-between">
                              <span className="text-[#8C8479]">Payment Mode:</span>
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

                      {/* Status Management Quick Actions */}
                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        {order.status !== 'paid' && (
                          <button
                            type="button"
                            disabled={isUpdatingStatus}
                            onClick={() => handleStatusUpdate(order.orderId, 'paid')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                          >
                            <Check size={13} /> Mark Paid
                          </button>
                        )}
                        {order.status !== 'cancelled' && (
                          <button
                            type="button"
                            disabled={isUpdatingStatus}
                            onClick={() => handleStatusUpdate(order.orderId, 'cancelled')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition cursor-pointer"
                          >
                            <Ban size={13} /> Cancel Order
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openReceiptModal(order)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#DCD6CC] hover:bg-[#FAF7F2] text-xs font-semibold text-[#4A443B] transition cursor-pointer ml-auto"
                        >
                          <Printer size={13} /> Print Bill
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Printable Receipt Modal */}
      {receiptToPrint && (
        <OrderReceiptModal
          receipt={receiptToPrint}
          onClose={() => setReceiptToPrint(null)}
        />
      )}
    </div>
  );
}
