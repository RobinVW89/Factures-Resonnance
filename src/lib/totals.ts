import type { Item } from '../types/invoice';

export function computeTotals(items: Item[], vatPct: number) {
  const subtotal = items.reduce((sum, item) => {
    const discount = item.discountPct ?? 0;
    return sum + item.quantity * item.unitPrice * (1 - discount / 100);
  }, 0);
  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const vatAmount = Math.round(roundedSubtotal * vatPct) / 100;
  const grandTotal = Math.round((roundedSubtotal + vatAmount) * 100) / 100;
  return { subtotal: roundedSubtotal, vatPct, vatAmount, grandTotal };
}
