export interface Variant {
  year: number;
  price: number;
  stock: number;
}

export function getAgeRange(variants: Variant[] | undefined): string {
  if (!variants || variants.length === 0) return '';
  
  const years = variants.map(v => v.year).sort((a, b) => a - b);
  const min = years[0];
  const max = years[years.length - 1];
  
  if (min === max) return `${min}y`;
  return `${min}-${max}y`;
}
