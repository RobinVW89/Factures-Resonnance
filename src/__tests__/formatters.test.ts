import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, calcTotals } from '../lib/formatters';

describe('formatCurrency', () => {
  it('formats zero', () => {
    expect(formatCurrency(0)).toMatch(/0/);
  });
  it('formats a positive amount', () => {
    expect(formatCurrency(1234.56)).toMatch(/1/);
  });
});

describe('formatDate', () => {
  it('formats an ISO date to French format', () => {
    const result = formatDate('2026-01-15');
    expect(result).toBe('15/01/2026');
  });
  it('returns empty string for empty input', () => {
    expect(formatDate('')).toBe('');
  });
});

describe('calcTotals', () => {
  it('calculates totals with no discount no VAT', () => {
    const totals = calcTotals([{ quantity: 2, unitPrice: 100, discountPct: 0 }], 0);
    expect(totals.subtotal).toBe(200);
    expect(totals.vatAmount).toBe(0);
    expect(totals.grandTotal).toBe(200);
  });
  it('calculates totals with discount', () => {
    const totals = calcTotals([{ quantity: 1, unitPrice: 100, discountPct: 10 }], 0);
    expect(totals.subtotal).toBe(90);
  });
  it('calculates totals with VAT', () => {
    const totals = calcTotals([{ quantity: 1, unitPrice: 100 }], 20);
    expect(totals.subtotal).toBe(100);
    expect(totals.vatAmount).toBe(20);
    expect(totals.grandTotal).toBe(120);
  });
});
