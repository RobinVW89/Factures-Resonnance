import { describe, it, expect } from 'vitest';
import { computeTotals } from './totals';

describe('computeTotals', () => {
  it('computes basic totals', () => {
    const items = [{ description: 'A', quantity: 2, unitPrice: 100 }];
    const t = computeTotals(items, 0);
    expect(t.subtotal).toBe(200);
    expect(t.vatAmount).toBe(0);
    expect(t.grandTotal).toBe(200);
  });

  it('applies discount', () => {
    const items = [{ description: 'A', quantity: 1, unitPrice: 100, discountPct: 10 }];
    const t = computeTotals(items, 0);
    expect(t.subtotal).toBe(90);
  });

  it('computes VAT', () => {
    const items = [{ description: 'A', quantity: 1, unitPrice: 100 }];
    const t = computeTotals(items, 20);
    expect(t.vatAmount).toBe(20);
    expect(t.grandTotal).toBe(120);
  });
});
