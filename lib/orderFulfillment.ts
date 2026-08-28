import dbConnect from '@/lib/mongodb';
import Order, { IOrder } from '@/lib/models/Order';
import Product from '@/lib/models/Product';

export interface FulfillmentResult {
  success: boolean;
  alreadyFulfilled?: boolean;
  order?: IOrder;
  error?: string;
}

/**
 * Fulfills an order in a 100% idempotent and race-condition-safe manner.
 * Safe to be called multiple times by client verification and webhooks.
 */
export async function fulfillOrder(
  orderId: string,
  paymentId?: string,
  paymentDetails?: { method?: string; error?: string }
): Promise<FulfillmentResult> {
  if (!orderId) {
    return { success: false, error: 'Order ID is required' };
  }

  await dbConnect();

  // 1. Check existing order
  const existing = await Order.findOne({ orderId });
  if (!existing) {
    return { success: false, error: `Order with ID ${orderId} not found` };
  }

  if (existing.status === 'paid') {
    console.log(`[Order Fulfillment] Order ${orderId} already fulfilled. Skipping duplicate action.`);
    return { success: true, alreadyFulfilled: true, order: existing };
  }

  // 2. Atomically transition status from pending/failed to paid
  const order = await Order.findOneAndUpdate(
    { orderId, status: { $ne: 'paid' } },
    {
      status: 'paid',
      ...(paymentId ? { paymentId } : {}),
      ...(paymentDetails?.method ? { paymentMethod: paymentDetails.method } : {}),
    },
    { returnDocument: 'after' }
  );

  // If another concurrent request already transitioned it
  if (!order) {
    const rechecked = await Order.findOne({ orderId });
    if (rechecked && rechecked.status === 'paid') {
      return { success: true, alreadyFulfilled: true, order: rechecked };
    }
    return { success: false, error: 'Failed to update order status' };
  }

  // 3. Deduct stock for each item in the order
  try {
    for (const item of order.items) {
      await Product.updateOne(
        {
          id: item.productId,
          'variants.year': item.year,
        },
        {
          $inc: { 'variants.$.stock': -item.qty }
        }
      );
    }
  } catch (stockError) {
    console.error(`[Order Fulfillment] Warning: Failed to decrement stock for order ${orderId}:`, stockError);
  }

  // 4. Send Email Notifications asynchronously with isolated error boundaries
  try {
    const { sendOrderNotification, sendCustomerConfirmation } = await import('@/lib/email');
    await Promise.allSettled([
      sendOrderNotification(order),
      sendCustomerConfirmation(order),
    ]);
  } catch (emailError) {
    console.error(`[Order Fulfillment] Email dispatch failed for order ${orderId}:`, emailError);
  }

  console.log(`[Order Fulfillment] Successfully fulfilled order ${order.orderNumber} (Razorpay Order ID: ${orderId})`);
  return { success: true, alreadyFulfilled: false, order };
}
