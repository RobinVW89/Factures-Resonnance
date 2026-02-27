import type { Invoice } from '../types/invoice';

const INVOICES_KEY = 'fr.invoices';
const THEME_KEY = 'fr.theme';
const LEGAL_TEMPLATE_KEY = 'fr.legal.template';

export const loadInvoices = (): Invoice[] => {
  const raw = localStorage.getItem(INVOICES_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Invoice[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveInvoices = (invoices: Invoice[]): void => {
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
};

export const upsertInvoice = (invoice: Invoice): Invoice[] => {
  const invoices = loadInvoices();
  const index = invoices.findIndex((entry) => entry.id === invoice.id);

  if (index >= 0) {
    invoices[index] = invoice;
  } else {
    invoices.unshift(invoice);
  }

  saveInvoices(invoices);
  return invoices;
};

export const exportInvoicesAsJson = (): string => JSON.stringify(loadInvoices(), null, 2);

export const importInvoicesFromJson = (jsonContent: string): Invoice[] => {
  const parsed = JSON.parse(jsonContent) as Invoice[];
  if (!Array.isArray(parsed)) {
    throw new Error('Le fichier JSON doit contenir une liste de factures.');
  }

  saveInvoices(parsed);
  return parsed;
};

export const saveTheme = (theme: 'light' | 'dark'): void => {
  localStorage.setItem(THEME_KEY, theme);
};

export const loadTheme = (): 'light' | 'dark' => {
  const raw = localStorage.getItem(THEME_KEY);
  return raw === 'dark' ? 'dark' : 'light';
};

export const saveLegalTemplate = (template: string): void => {
  localStorage.setItem(LEGAL_TEMPLATE_KEY, template);
};

export const loadLegalTemplate = (): string => localStorage.getItem(LEGAL_TEMPLATE_KEY) || '';
