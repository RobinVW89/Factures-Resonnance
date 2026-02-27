import { describe, it, expect, beforeEach } from 'vitest';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

import { getNextInvoiceNumber, resetInvoiceCounter } from '../lib/invoiceNumber';

beforeEach(() => {
  localStorageMock.clear();
});

describe('getNextInvoiceNumber', () => {
  it('generates first number of current year', () => {
    const year = new Date().getFullYear();
    const num = getNextInvoiceNumber();
    expect(num).toBe(`${year}-0001`);
  });

  it('increments on subsequent calls', () => {
    const year = new Date().getFullYear();
    getNextInvoiceNumber();
    const second = getNextInvoiceNumber();
    expect(second).toBe(`${year}-0002`);
  });

  it('resets after resetInvoiceCounter', () => {
    getNextInvoiceNumber();
    resetInvoiceCounter();
    const year = new Date().getFullYear();
    const num = getNextInvoiceNumber();
    expect(num).toBe(`${year}-0001`);
  });
});
