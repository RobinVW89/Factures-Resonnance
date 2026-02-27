import { describe, it, expect, beforeEach } from 'vitest';
import { getNextNumber } from './numbering';

describe('getNextNumber', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts at 0001', () => {
    const num = getNextNumber();
    const year = new Date().getFullYear();
    expect(num).toBe(`${year}-0001`);
  });

  it('increments', () => {
    getNextNumber();
    const num = getNextNumber();
    const year = new Date().getFullYear();
    expect(num).toBe(`${year}-0002`);
  });

  it('resets on year change', () => {
    const year = new Date().getFullYear();
    localStorage.setItem('invoice_counter', JSON.stringify({ year: year - 1, count: 99 }));
    const num = getNextNumber();
    expect(num).toBe(`${year}-0001`);
  });
});
