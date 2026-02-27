import type { Invoice } from '../types/invoice';

const INVOICES_KEY = 'invoices';
const LOGO_KEY = 'invoice_logo';

export function saveInvoice(invoice: Invoice): void {
  const invoices = loadInvoices();
  const idx = invoices.findIndex(inv => inv.id === invoice.id);
  if (idx >= 0) {
    invoices[idx] = invoice;
  } else {
    invoices.push(invoice);
  }
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
}

export function loadInvoices(): Invoice[] {
  const stored = localStorage.getItem(INVOICES_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as Invoice[];
  } catch {
    return [];
  }
}

export function deleteInvoice(id: string): void {
  const invoices = loadInvoices().filter(inv => inv.id !== id);
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
}

export function exportJSON(): string {
  return JSON.stringify(loadInvoices(), null, 2);
}

export function importJSON(json: string): void {
  const invoices = JSON.parse(json) as Invoice[];
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
}

export function saveLogo(base64: string): void {
  localStorage.setItem(LOGO_KEY, base64);
}

export function loadLogo(): string | null {
  return localStorage.getItem(LOGO_KEY);
}
