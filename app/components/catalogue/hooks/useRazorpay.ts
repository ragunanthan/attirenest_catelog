'use client';

import { useCallback, useEffect, useState } from 'react';
import { CartItem, ShippingInfo } from '../types';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

const RZP_KEY = process.env.NEXT_PUBLIC_RAZOR_PAY_KEY_ID;

export function useRazorpay(
  cart: CartItem[],
  totalPrice: number,
  totalCount: number,
  onSuccess: () => void
) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Load Razorpay script on mount
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const handlePayment = useCallback(async (shippingInfo: ShippingInfo) => {
    if (cart.length === 0) return;
    if (!window.Razorpay) {
      alert('Payment gateway not loaded. Please refresh the page.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalPrice,
          items: cart,
          shippingAddress: shippingInfo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create order');

      const rzp = new window.Razorpay({
        key: RZP_KEY,
        amount: data.amount,
        currency: data.currency,
        name: 'Attirenest',
        description: `Order for ${totalCount} item(s)`,
        order_id: data.orderId,
        prefill: {
          name: shippingInfo.fullName,
          contact: shippingInfo.phone,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (verifyRes.ok) {
              onSuccess();
              setPaymentSuccess(true);
              setTimeout(() => setPaymentSuccess(false), 5000);
            } else {
              const verifyData = await verifyRes.json();
              alert(verifyData.error || 'Payment verification failed');
            }
          } catch (err) {
            console.error('Verification error:', err);
            alert('Error verifying payment');
          } finally {
            setIsLoading(false);
          }
        },
        theme: { color: '#5A7A56' },
        modal: { ondismiss: () => setIsLoading(false) },
      });

      rzp.on('payment.failed', () => {
        alert('Payment failed. Please try again.');
        setIsLoading(false);
      });

      rzp.open();
    } catch (err) {
      console.error('[Razorpay]', err);
      alert('Could not initiate payment. Please try again.');
      setIsLoading(false);
    }
  }, [cart, totalPrice, totalCount, onSuccess]);

  return { handlePayment, isLoading, paymentSuccess };
}
