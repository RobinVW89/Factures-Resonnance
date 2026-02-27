import { describe, it, expect } from 'vitest';
import { formatAmount, formatDate, parseAmount } from './formatters';

describe('formatAmount', () => {
  it('formats integer', () => {
    expect(formatAmount(1234.56)).toBe('1\u202f234,56\u00a0€');
  });
  it('formats zero', () => {
    expect(formatAmount(0)).toBe('0,00\u00a0€');
  });
  it('formats small amount', () => {
    expect(formatAmount(9.9)).toBe('9,90\u00a0€');
  });
});

describe('formatDate', () => {
  it('formats ISO date', () => {
    expect(formatDate('2026-01-15')).toBe('15/01/2026');
  });
  it('returns empty for empty string', () => {
    expect(formatDate('')).toBe('');
  });
});

describe('parseAmount', () => {
  it('parses French amount', () => {
    expect(parseAmount('1\u202f234,56\u00a0€')).toBeCloseTo(1234.56);
  });
});
