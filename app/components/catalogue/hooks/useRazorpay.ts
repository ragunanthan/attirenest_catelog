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

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function useRazorpay(
  cart: CartItem[],
  totalPrice: number,
  totalCount: number,
  onSuccess: () => void
) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  // Preload Razorpay script on mount
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const handlePayment = useCallback(async (shippingInfo: ShippingInfo) => {
    if (cart.length === 0) return;

    setIsLoading(true);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !window.Razorpay) {
      alert('Payment gateway could not be loaded. Please check your internet connection or try again.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Create order on server (server calculates authoritative price and checks stock)
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
      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to initialize payment order');
      }

      // 2. Configure Razorpay checkout options
      const options = {
        key: data.key || RZP_KEY,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'AttireNest',
        description: `Order for ${totalCount} item(s)`,
        order_id: data.orderId,
        prefill: {
          name: shippingInfo.fullName,
          email: shippingInfo.email,
          contact: shippingInfo.phone,
        },
        theme: {
          color: '#5A7A56',
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

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              setOrderNumber(verifyData.orderNumber || data.orderNumber);
              onSuccess();
              setPaymentSuccess(true);
              setTimeout(() => {
                setPaymentSuccess(false);
                setOrderNumber(null);
              }, 10000); // Display success banner for 10 seconds
            } else {
              alert(verifyData.error || 'Payment verification failed. Please contact support.');
            }
          } catch (err) {
            console.error('[Razorpay Verify Client Error]:', err);
            alert('An error occurred while verifying payment. If amount was debited, your order will be confirmed shortly.');
          } finally {
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            // Do not eagerly cancel order here to avoid cancelling when user switches to external UPI app
          },
        },
      };

      const rzp = new window.Razorpay(options);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rzp.on('payment.failed', async (response: any) => {
        console.error('[Razorpay Payment Failed]:', response.error);
        const errorDesc = response.error?.description || 'Payment was not completed. Please try again.';
        alert(`Payment failed: ${errorDesc}`);
        setIsLoading(false);

        try {
          await fetch('/api/razorpay/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: data.orderId,
              status: 'failed',
            }),
          });
        } catch (e) {
          console.error('[Cancel Notification Failed]:', e);
        }
      });

      rzp.open();
    } catch (err: unknown) {
      console.error('[Razorpay Checkout Error]:', err);
      const msg = err instanceof Error ? err.message : 'Could not initiate payment. Please try again.';
      alert(msg);
      setIsLoading(false);
    }
  }, [cart, totalPrice, totalCount, onSuccess]);

  return { handlePayment, isLoading, paymentSuccess, orderNumber };
}
