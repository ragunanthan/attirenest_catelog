import mongoose from 'mongoose';

export interface ICategory extends mongoose.Document {
  id: string; // The URL-friendly ID (e.g. "everyday")
  name: string;
  description: string;
  theme: string;
}

const CategorySchema = new mongoose.Schema<ICategory>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  theme: { type: String, required: true },
});

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
