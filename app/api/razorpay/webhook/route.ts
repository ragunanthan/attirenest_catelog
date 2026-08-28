import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { fulfillOrder } from '@/lib/orderFulfillment';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZOR_PAY_KEY_SECRET;

    if (!webhookSecret) {
      console.warn(
        '[Razorpay Webhook] No webhook secret or key secret configured. Skipping signature validation in dev.'
      );
    } else if (signature) {
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error('[Razorpay Webhook] Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } else {
      console.warn('[Razorpay Webhook] Missing x-razorpay-signature header');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let payload: Record<string, any>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const event = payload.event;
    console.log(`[Razorpay Webhook] Received event: ${event}`);

    switch (event) {
      case 'order.paid':
      case 'payment.captured': {
        const paymentEntity = payload.payload?.payment?.entity;
        const orderEntity = payload.payload?.order?.entity;

        const orderId = paymentEntity?.order_id || orderEntity?.id;
        const paymentId = paymentEntity?.id;
        const paymentMethod = paymentEntity?.method;

        if (orderId) {
          console.log(`[Razorpay Webhook] Fulfilling order from webhook: ${orderId}`);
          await fulfillOrder(orderId, paymentId, { method: paymentMethod });
        }
        break;
      }

      case 'payment.failed': {
        const paymentEntity = payload.payload?.payment?.entity;
        const orderId = paymentEntity?.order_id;
        const errorDesc =
          paymentEntity?.error_description ||
          paymentEntity?.error_code ||
          'Payment failed';

        if (orderId) {
          await dbConnect();
          // Only update if currently pending so we never overwrite an already paid order
          await Order.findOneAndUpdate(
            { orderId: orderId, status: 'pending' },
            {
              status: 'failed',
              paymentError: errorDesc,
              ...(paymentEntity?.id ? { paymentId: paymentEntity.id } : {}),
            }
          );
          console.log(`[Razorpay Webhook] Order ${orderId} marked as failed from webhook`);
        }
        break;
      }

      default:
        console.log(`[Razorpay Webhook] Unhandled event type: ${event}`);
    }

    // Acknowledge receipt to Razorpay
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('[Razorpay Webhook Error]:', error);
    // Return 200 to prevent Razorpay from endlessly retrying transient unrecoverable errors
    return NextResponse.json({ status: 'error', message: 'Internal error logged' }, { status: 200 });
  }
}
