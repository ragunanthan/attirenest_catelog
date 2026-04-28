import mongoose from 'mongoose';

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
}

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
});

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
