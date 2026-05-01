export type Category = {
  id: string;
  name: string;
  description: string;
  theme: string;
};

export type Variant = {
  year: string;
  price: number;
  stock: number;
};

export type Product = {
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
  variants?: Variant[];
};

export type CartItem = {
  id: number;
  name: string;
  year: string;
  price: number;
  qty: number;
  maxStock: number;
};

export type CatalogueProps = {
  initialCategories: Category[];
  initialProducts: Product[];
};

export type ShippingInfo = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
};