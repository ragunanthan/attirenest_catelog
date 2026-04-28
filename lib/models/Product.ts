import mongoose from 'mongoose';

export interface IVariant {
  year: number;
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
  ageRange: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  image: string;
  variants: IVariant[];
}

const VariantSchema = new mongoose.Schema<IVariant>({
  year: { type: Number, required: true },
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
  ageRange: { type: String, required: true },
  badge: { type: String, required: false },
  badgeBg: { type: String, required: false },
  badgeColor: { type: String, required: false },
  image: { type: String, required: true },
  variants: [VariantSchema],
});

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
