import mongoose from 'mongoose';

export interface IVariant {
  year: string;
  price: number;
  stock: number;
}

export interface IProduct extends mongoose.Document {
  id: number;
  categoryId: string;
  name: string;
  features: string;
  description: string;
  basePrice: number;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  images: string[];
  variants: IVariant[];
}

const VariantSchema = new mongoose.Schema<IVariant>({
  year: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
});

const ProductSchema = new mongoose.Schema<IProduct>({
  id: { type: Number, required: true, unique: true },
  categoryId: { type: String, required: true },
  name: { type: String, required: true },
  features: { type: String, required: true },
  description: { type: String, required: true },
  basePrice: { type: Number, required: true },
  badge: { type: String, required: false },
  badgeBg: { type: String, required: false },
  badgeColor: { type: String, required: false },
  images: { type: [String], required: true },
  variants: [VariantSchema],
});

// Force delete the model from cache to ensure the new schema is picked up
if (mongoose.models.Product) {
  delete (mongoose.models as any).Product;
}

export default mongoose.model<IProduct>('Product', ProductSchema);
