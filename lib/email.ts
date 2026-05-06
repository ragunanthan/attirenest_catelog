import nodemailer from 'nodemailer';
import { IOrder } from './models/Order';
import Product from './models/Product';

/**
 * SHARED HELPERS
 */

const getTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
};

const getItemsWithImages = async (items: any[]) => {
  return Promise.all(
    items.map(async (item) => {
      const product = await Product.findOne({ id: item.productId });
      return {
        name: item.name,
        year: item.year,
        qty: item.qty,
        price: item.price,
        image: product?.images?.[0] || '',
      };
    })
  );
};

const emailStyles = `
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9f9f9; }
  .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
  .header { background: #5A7A56; color: #ffffff; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
  .content { padding: 30px; }
  .order-meta { background: #f0ede8; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
  .order-meta p { margin: 5px 0; font-size: 14px; font-weight: 600; color: #5A7A56; }
  .item { display: flex; align-items: center; padding: 15px 0; border-bottom: 1px solid #f0f0f0; }
  .item:last-child { border-bottom: none; }
  .item-img { width: 80px; height: 100px; object-fit: cover; border-radius: 8px; margin-right: 20px; background: #f5f5f5; }
  .item-details { flex: 1; }
  .item-name { font-weight: 700; font-size: 16px; color: #2E2A27; margin: 0; }
  .item-sub { font-size: 13px; color: #7a766f; margin: 4px 0; }
  .item-price { font-weight: 700; font-size: 15px; color: #2E2A27; }
  .shipping { margin-top: 30px; background: #fafafa; padding: 20px; border-radius: 8px; border: 1px solid #eee; }
  .shipping h3 { margin-top: 0; font-size: 15px; color: #5A7A56; text-transform: uppercase; letter-spacing: 1px; }
  .shipping p { margin: 4px 0; font-size: 13px; color: #4a4642; }
  .footer { text-align: center; padding: 20px; font-size: 12px; color: #9a938c; border-top: 1px solid #f0f0f0; }
  .thanks-msg { font-size: 16px; color: #2E2A27; margin-bottom: 20px; text-align: center; }
`;

const renderEmailBody = (order: IOrder, itemsWithImages: any[], isCustomer: boolean) => {
  const title = isCustomer ? 'Order Confirmed! ✨' : 'New Order Received! 🛍️';
  const greeting = isCustomer 
    ? `<p class="thanks-msg">Hi ${order.shippingAddress.fullName.split(' ')[0]}, thank you for shopping with us! Your order has been placed successfully.</p>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head><style>${emailStyles}</style></head>
    <body>
      <div class="container">
        <div class="header"><h1>${title}</h1></div>
        <div class="content">
          ${greeting}
          <div class="order-meta">
            <p>Order ID: ${order.orderNumber}</p>
            <p>Total Paid: ₹${order.amount.toLocaleString('en-IN')}</p>
          </div>
          <div class="items">
            ${itemsWithImages.map(item => `
              <div class="item">
                ${item.image ? `<img src="${item.image}" class="item-img" alt="${item.name}">` : '<div class="item-img"></div>'}
                <div class="item-details">
                  <p class="item-name">${item.name}</p>
                  <p class="item-sub">Age: ${item.year} | Qty: ${item.qty}</p>
                  <p class="item-price">₹${item.price.toLocaleString('en-IN')}</p>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="shipping">
            <h3>${isCustomer ? 'Delivery Address' : 'Shipping Details'}</h3>
            <p><strong>${order.shippingAddress.fullName}</strong></p>
            <p>${order.shippingAddress.phone}</p>
            <p>${order.shippingAddress.email}</p>
            <p>${order.shippingAddress.addressLine1}</p>
            ${order.shippingAddress.addressLine2 ? `<p>${order.shippingAddress.addressLine2}</p>` : ''}
            <p>${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}</p>
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} AttireNest. ${isCustomer ? 'Thank you for your support!' : 'New Order Notification.'}
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * EXPORTED FUNCTIONS
 */

export async function sendOrderNotification(order: IOrder) {
  const transporter = getTransporter();
  const adminEmails = process.env.ADMIN_EMAILS_NOTIFICATION;

  if (!transporter || !adminEmails) {
    console.error('Email config missing for Admin');
    return;
  }

  const items = await getItemsWithImages(order.items);
  const html = renderEmailBody(order, items, false);

  try {
    await transporter.sendMail({
      from: `"AttireNest Admin" <${process.env.EMAIL_USER}>`,
      to: adminEmails,
      subject: `New Order Received: ${order.orderNumber}`,
      html,
    });
    console.log(`Admin notification sent: ${order.orderNumber}`);
  } catch (err) {
    console.error('Admin email failed:', err);
  }
}

export async function sendCustomerConfirmation(order: IOrder) {
  const transporter = getTransporter();
  const customerEmail = order.shippingAddress.email;

  if (!transporter || !customerEmail) {
    console.error('Email config missing for Customer');
    return;
  }

  const items = await getItemsWithImages(order.items);
  const html = renderEmailBody(order, items, true);

  try {
    await transporter.sendMail({
      from: `"AttireNest" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `Order Confirmed: ${order.orderNumber}`,
      html,
    });
    console.log(`Customer confirmation sent: ${customerEmail}`);
  } catch (err) {
    console.error('Customer email failed:', err);
  }
}
