import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone');

  if (!phone || phone.length < 10) {
    return NextResponse.json({ address: null });
  }

  try {
    await dbConnect();

    // Find the most recent paid order with this phone number
    const order = await Order.findOne(
      { 'shippingAddress.phone': phone, status: 'paid' },
      { shippingAddress: 1 }
    ).sort({ createdAt: -1 }).lean();

    if (order && order.shippingAddress) {
      return NextResponse.json({ address: order.shippingAddress });
    }

    return NextResponse.json({ address: null });
  } catch (error) {
    console.error('Customer lookup failed:', error);
    return NextResponse.json({ address: null });
  }
}
