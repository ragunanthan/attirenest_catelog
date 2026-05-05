import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';

export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = await req.json();

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZOR_PAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    await dbConnect();

    // 1. Update order status
    const order = await Order.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        status: 'paid',
        paymentId: razorpay_payment_id
      },
      { new: true }
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. Decrease stock for each item
    for (const item of order.items) {
      await Product.updateOne(
        {
          id: item.productId,
          'variants.year': item.year
        },
        {
          $inc: { 'variants.$.stock': -item.qty }
        }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      orderNumber: order.orderNumber
    });
  } catch (error) {
    console.error('Payment verification failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
