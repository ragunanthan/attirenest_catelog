import { Product } from './types';
import { getAgeRange } from '@/lib/productUtils';

type Props = {
  product: Product;
  selectedYear: number;
  displayPrice: number;
  isPriceAnimating: boolean;
  isAdded: boolean;
  onYearChange: (product: Product, yearStr: string) => void;
  onAddToCart: (product: Product) => void;
};

export function ProductCard({
  product,
  selectedYear,
  displayPrice,
  isPriceAnimating,
  isAdded,
  onYearChange,
  onAddToCart,
}: Props) {
  const hasVariants = !!product.variants?.length;
  const availableVariants = hasVariants ? product.variants!.filter(v => v.stock > 0) : [];
  const isAllOutOfStock = hasVariants && availableVariants.length === 0;

  return (
    <article className="product bg-white rounded-[28px] p-3 md:p-4 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.15)]">
      {/* Image */}
      <div className="relative aspect-[4/5] rounded-[20px] overflow-hidden flex items-center justify-center bg-[#f5f5f5]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover transition duration-500 hover:scale-105 ${isAllOutOfStock ? 'grayscale opacity-60' : ''}`}
          loading="lazy"
        />

        {isAllOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
            <span className="px-4 py-2 bg-white/90 rounded-full text-xs font-bold text-red-500 shadow-lg">SOLD OUT</span>
          </div>
        )}

        {getAgeRange(product.variants) && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-[11px] font-medium">
            {getAgeRange(product.variants)}
          </span>
        )}

        {product.badge && (
          <span
            className="absolute bottom-3 right-3 px-2 py-1 rounded-full text-[10px] uppercase font-medium"
            style={{ background: product.badgeBg ?? '#A8C3A5', color: product.badgeColor ?? '#fff' }}
          >
            {product.badge}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="pt-3.5">
        <h3 className="font-semibold leading-snug">{product.name}</h3>
        <p className="text-xs text-[#7a766f] mt-0.5">{product.features}</p>

        {/* Age selector */}
        <div className="flex items-center gap-2 mt-2">
          <label htmlFor={`age-${product.id}`} className="text-[11px] text-[#7a766f]">Age:</label>
          <select
            id={`age-${product.id}`}
            className="year-select"
            value={selectedYear || ''}
            onChange={(e) => onYearChange(product, e.target.value)}
            disabled={isAllOutOfStock}
          >
            <option value="">{isAllOutOfStock ? 'Sold Out' : 'Select'}</option>
            {availableVariants.map(v => (
              <option key={v.year} value={v.year}>{v.year}Y</option>
            ))}
          </select>
        </div>

        {/* Price + Add button */}
        <div className="flex items-center justify-between mt-3">
          <span className={`price-display ${isPriceAnimating ? 'price-pop' : ''}`} aria-live="polite">
            ₹{displayPrice.toLocaleString('en-IN')}
          </span>
          <button
            className={`add-cart-btn ${isAllOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => onAddToCart(product)}
            disabled={isAllOutOfStock}
            aria-label={`Add ${product.name} to cart`}
          >
            {isAdded ? '✅ Added!' : isAllOutOfStock ? 'Sold Out' : '🛒 Add'}
          </button>
        </div>
      </div>
    </article>
  );
}
