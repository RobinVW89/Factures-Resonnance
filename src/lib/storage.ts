import type { Invoice } from '../types/invoice';

const STORAGE_KEY = 'factures_resonnance_invoices';

export function loadInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Invoice[]) : [];
  } catch {
    return [];
  }
}

export function saveInvoices(invoices: Invoice[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
}

export function exportInvoicesJSON(invoices: Invoice[]): void {
  const blob = new Blob([JSON.stringify(invoices, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `factures-${new Date().toISOString().substring(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importInvoicesJSON(): Promise<Invoice[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve([]);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string) as Invoice[];
          resolve(data);
        } catch {
          alert('Fichier JSON invalide');
          resolve([]);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}
