import { NextRequest, NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';

interface CartInputItem {
  id: number;
  name?: string;
  year: string | number;
  price?: number;
  qty: number;
}

export async function POST(req: NextRequest) {
  try {
    const { items, shippingAddress } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart cannot be empty' }, { status: 400 });
    }

    await dbConnect();

    // 1. Fetch authoritative product data from database
    const productIds = items.map((i: CartInputItem) => Number(i.id));
    const dbProducts = await Product.find({ id: { $in: productIds } }).lean();
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let verifiedTotal = 0;
    const verifiedItems = [];

    // 2. Validate price and stock server-side for each cart item
    for (const item of items) {
      const pId = Number(item.id);
      const qty = Math.floor(Number(item.qty));
      const yearStr = String(item.year || '').trim();

      if (!qty || qty <= 0) {
        return NextResponse.json(
          { error: `Invalid quantity for item ${item.name || pId}` },
          { status: 400 }
        );
      }

      const product = productMap.get(pId);
      if (!product) {
        return NextResponse.json(
          { error: `Product "${item.name || pId}" not found in catalogue` },
          { status: 400 }
        );
      }

      // Check variant and stock
      const variant = product.variants?.find((v: { year: string; price: number; stock: number }) => v.year === yearStr);
      if (!variant) {
        return NextResponse.json(
          { error: `Variant size "${yearStr}" not found for "${product.name}"` },
          { status: 400 }
        );
      }

      if (variant.stock < qty) {
        return NextResponse.json(
          {
            error: `"${product.name}" (${yearStr}) only has ${variant.stock} left in stock. Please adjust quantity.`,
          },
          { status: 400 }
        );
      }

      const itemPrice = Number(variant.price);
      verifiedTotal += itemPrice * qty;

      verifiedItems.push({
        productId: product.id,
        name: product.name,
        year: variant.year,
        price: itemPrice,
        qty: qty,
      });
    }

    if (verifiedTotal <= 0) {
      return NextResponse.json({ error: 'Calculated order total must be greater than zero' }, { status: 400 });
    }

    // 3. Generate human-friendly order number: AN-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `AN-${dateStr}-${randomStr}`;

    // 4. Create Razorpay order with server-calculated paise and rich metadata
    const orderAmountInPaise = Math.round(verifiedTotal * 100);
    const razorpayOrder = await razorpay.orders.create({
      amount: orderAmountInPaise,
      currency: 'INR',
      receipt: `rcpt_${orderNumber}`.slice(0, 40),
      notes: {
        orderNumber,
        customerName: (shippingAddress?.fullName || '').slice(0, 40),
        customerPhone: (shippingAddress?.phone || '').slice(0, 30),
        customerEmail: (shippingAddress?.email || '').slice(0, 50),
      },
    });

    // 5. Save pending order to database with verified amounts
    await Order.create({
      orderId: razorpayOrder.id,
      orderNumber: orderNumber,
      amount: verifiedTotal,
      currency: razorpayOrder.currency || 'INR',
      status: 'pending',
      shippingAddress: shippingAddress || {},
      items: verifiedItems,
    });

    return NextResponse.json({
      orderId: razorpayOrder.id,
      orderNumber: orderNumber,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.NEXT_PUBLIC_RAZOR_PAY_KEY_ID,
    });
  } catch (error) {
    console.error('[Razorpay Order Creation Error]:', error);
    return NextResponse.json({ error: 'Failed to create payment order. Please try again.' }, { status: 500 });
  }
}
