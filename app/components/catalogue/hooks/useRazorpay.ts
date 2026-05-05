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
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

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
              const verifyData = await verifyRes.json();
              setOrderNumber(verifyData.orderNumber);
              onSuccess();
              setPaymentSuccess(true);
              setTimeout(() => {
                setPaymentSuccess(false);
                setOrderNumber(null);
              }, 10000); // Show for 10 seconds
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
        modal: { 
          ondismiss: async () => {
            setIsLoading(false);
            // Only update if not already success or failed
            if (!paymentSuccess) {
              await fetch('/api/razorpay/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: data.orderId, status: 'cancelled' }),
              });
            }
          } 
        },
      });

      rzp.on('payment.failed', async (response: any) => {
        console.error('Payment failed:', response.error);
        alert('Payment failed: ' + (response.error.description || 'Please try again.'));
        setIsLoading(false);
        
        await fetch('/api/razorpay/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: data.orderId, status: 'failed' }),
        });
      });

      rzp.open();
    } catch (err) {
      console.error('[Razorpay]', err);
      alert('Could not initiate payment. Please try again.');
      setIsLoading(false);
    }
  }, [cart, totalPrice, totalCount, onSuccess]);

  return { handlePayment, isLoading, paymentSuccess, orderNumber };
}
