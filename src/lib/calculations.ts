import type { Item, Invoice } from '../types/invoice';

const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export const lineTotal = (item: Item): number => {
  const qty = Math.max(0, item.quantity || 0);
  const unit = Math.max(0, item.unitPrice || 0);
  const discount = Math.min(100, Math.max(0, item.discountPct || 0));
  return round2(qty * unit * (1 - discount / 100));
};

export const computeTotals = (items: Item[], vatPct: number = 0): Invoice['totals'] => {
  const subtotal = round2(items.reduce((sum, item) => sum + lineTotal(item), 0));
  const safeVat = Math.max(0, vatPct || 0);
  const vatAmount = round2(subtotal * safeVat);
  const grandTotal = round2(subtotal + vatAmount);

  return {
    subtotal,
    vatPct: safeVat,
    vatAmount,
    grandTotal,
  };
};
