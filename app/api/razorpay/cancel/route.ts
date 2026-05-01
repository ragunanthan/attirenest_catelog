import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';

export async function POST(req: NextRequest) {
  try {
    const { orderId, status } = await req.json();

    if (!orderId || !['failed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    await dbConnect();

    const order = await Order.findOneAndUpdate(
      { orderId: orderId },
      { status: status },
      { new: true }
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log(`[Order Update] Order ${orderId} marked as ${status}`);
    return NextResponse.json({ success: true, status: order.status });
  } catch (error) {
    console.error('Failed to update order status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
