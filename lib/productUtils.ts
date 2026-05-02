export interface Variant {
  year: string;
  price: number;
  stock: number;
}

export function getAgeRange(variants: Variant[] | undefined): string {
  if (!variants || variants.length === 0) return '';
  
  const years = variants.map(v => v.year);
  const min = years[0];
  const max = years[years.length - 1];
  
  if (min === max) return min;
  return `${min} - ${max}`;
}
