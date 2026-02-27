export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatDate(isoDate: string): string {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return new Intl.DateTimeFormat('fr-FR').format(new Date(+y, +m - 1, +d));
}

export function formatDateInput(isoDate: string): string {
  return isoDate ? isoDate.substring(0, 10) : '';
}

export function todayISO(): string {
  return new Date().toISOString().substring(0, 10);
}

export function calcTotals(items: { quantity: number; unitPrice: number; discountPct?: number }[], vatPct = 0): {
  subtotal: number;
  vatPct: number;
  vatAmount: number;
  grandTotal: number;
} {
  const subtotal = items.reduce((sum, item) => {
    const disc = item.discountPct ?? 0;
    return sum + item.quantity * item.unitPrice * (1 - disc / 100);
  }, 0);
  const vatAmount = subtotal * (vatPct / 100);
  const grandTotal = subtotal + vatAmount;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    vatPct,
    vatAmount: Math.round(vatAmount * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
  };
}
