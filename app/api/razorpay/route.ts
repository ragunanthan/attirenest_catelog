import Razorpay from 'razorpay';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';

const razorpay = new Razorpay({
  key_id: process.env.RAZOR_PAY_KEY_ID!,
  key_secret: process.env.RAZOR_PAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const { amount, items, shippingAddress } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    await dbConnect();
    
    // Generate human-friendly order number: AN-20240504-ABCD
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `AN-${dateStr}-${randomStr}`;

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });

    // Save pending order to database
    await Order.create({
      orderId: order.id,
      orderNumber: orderNumber,
      amount: amount,
      currency: 'INR',
      status: 'pending',
      shippingAddress: shippingAddress || {},
      items: items.map((item: { id: number; name: string; year: number; price: number; qty: number }) => ({
        productId: item.id,
        name: item.name,
        year: item.year,
        price: item.price,
        qty: item.qty,
      })),
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
}

