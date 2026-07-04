import type { ProductIngredient } from '@/types';

export function php(n: number | null | undefined): string {
  return '₱' + (Number(n) || 0).toFixed(2);
}

/** Cost of an ingredient for the whole batch: (unitPrice / pkgSize) * qty */
export function ingrBatchCost(ingr: Pick<ProductIngredient, 'unit_price' | 'pkg_size' | 'qty'>): number {
  const pkgSize = ingr.pkg_size || 1;
  return (ingr.unit_price / pkgSize) * ingr.qty;
}

/** Cost of an ingredient per tub, given the batch size (number of tubs). */
export function ingrCostPerTub(
  ingr: Pick<ProductIngredient, 'unit_price' | 'pkg_size' | 'qty'>,
  batchSize: number
): number {
  return ingrBatchCost(ingr) / (batchSize || 1);
}

export interface ProductCostSummary {
  batchTotal: number;
  ingredientCostPerTub: number;
  totalCostPerTub: number;
  sellingPrice: number;
  grossProfit: number;
  marginPct: number;
}

export function calcProductCosts(
  ingredients: Pick<ProductIngredient, 'unit_price' | 'pkg_size' | 'qty'>[],
  batchSize: number,
  sellingPrice: number,
  otherCosts: number
): ProductCostSummary {
  const batch = batchSize || 1;
  let batchTotal = 0;
  let tubTotal = 0;
  for (const ingr of ingredients) {
    const bc = ingrBatchCost(ingr);
    batchTotal += bc;
    tubTotal += bc / batch;
  }
  const totalCostPerTub = tubTotal + (otherCosts || 0);
  const grossProfit = (sellingPrice || 0) - totalCostPerTub;
  const marginPct = sellingPrice ? (grossProfit / sellingPrice) * 100 : 0;
  return {
    batchTotal,
    ingredientCostPerTub: tubTotal,
    totalCostPerTub,
    sellingPrice: sellingPrice || 0,
    grossProfit,
    marginPct,
  };
}

export function marginBadgeClass(marginPct: number): string {
  if (marginPct >= 20) return 'badge-green';
  if (marginPct >= 10) return 'badge-gold';
  return 'badge-red';
}

export function stockClass(stock: number): '' | 'low' | 'out' {
  if (stock === 0) return 'out';
  if (stock <= 1) return 'low';
  return '';
}
