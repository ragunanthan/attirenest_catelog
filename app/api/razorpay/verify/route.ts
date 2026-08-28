import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { fulfillOrder } from '@/lib/orderFulfillment';

export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required payment verification parameters' },
        { status: 400 }
      );
    }

    // 1. Timing-safe cryptographic HMAC signature verification
    const isAuthentic = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isAuthentic) {
      console.warn(`[Razorpay Verify] Invalid signature for order ${razorpay_order_id}`);
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // 2. Idempotently fulfill order, deduct stock, and send notifications
    const result = await fulfillOrder(razorpay_order_id, razorpay_payment_id);

    if (!result.success || !result.order) {
      return NextResponse.json(
        { error: result.error || 'Failed to complete order processing' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: result.order.orderId,
      orderNumber: result.order.orderNumber,
      alreadyFulfilled: result.alreadyFulfilled ?? false,
    });
  } catch (error) {
    console.error('[Razorpay Verify Error]:', error);
    return NextResponse.json({ error: 'Internal server error during verification' }, { status: 500 });
  }
}
