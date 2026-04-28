export type Category = {
  id: string;
  name: string;
  description: string;
  theme: string;
};

export type Variant = {
  year: number;
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
  ageRange: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  image: string;
  variants?: Variant[];
};

export type CartItem = {
  id: number;
  name: string;
  year: number;
  price: number;
  qty: number;
  maxStock: number;
};

export type CatalogueProps = {
  initialCategories: Category[];
  initialProducts: Product[];
};
