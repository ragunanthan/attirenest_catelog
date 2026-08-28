import Razorpay from 'razorpay';
import crypto from 'crypto';

if (!process.env.RAZOR_PAY_KEY_ID || !process.env.RAZOR_PAY_KEY_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.warn('[Razorpay] RAZOR_PAY_KEY_ID or RAZOR_PAY_KEY_SECRET is not set in environment variables.');
  }
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZOR_PAY_KEY_ID || 'rzp_placeholder',
  key_secret: process.env.RAZOR_PAY_KEY_SECRET || 'secret_placeholder',
});

/**
 * Timing-safe signature verification for Razorpay Checkout callback
 */
export function verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const secret = process.env.RAZOR_PAY_KEY_SECRET;
  if (!secret) {
    console.error('[Razorpay] RAZOR_PAY_KEY_SECRET missing during signature verification');
    return false;
  }

  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
  const receivedBuffer = Buffer.from(signature, 'utf-8');

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

/**
 * Timing-safe signature verification for Razorpay Webhook payloads
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!rawBody || !signature || !secret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
  const receivedBuffer = Buffer.from(signature, 'utf-8');

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
