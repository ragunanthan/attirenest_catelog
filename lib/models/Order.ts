import mongoose from 'mongoose';

export interface IOrderItem {
  productId: number;
  name: string;
  year: number;
  price: number;
  qty: number;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface IOrder extends mongoose.Document {
  orderId: string;
  paymentId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  customerInfo?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new mongoose.Schema<IOrder>({
  orderId: { type: String, required: true, unique: true },
  paymentId: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, default: 'INR' },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  items: [
    {
      productId: { type: Number, required: true },
      name: { type: String, required: true },
      year: { type: Number, required: true },
      price: { type: Number, required: true },
      qty: { type: Number, required: true },
    }
  ],
  shippingAddress: {
    fullName: { type: String },
    phone: { type: String },
    addressLine1: { type: String },
    addressLine2: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
  },
  customerInfo: {
    name: { type: String },
    email: { type: String },
    contact: { type: String },
  }
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
