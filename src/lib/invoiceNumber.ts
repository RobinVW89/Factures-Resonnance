const COUNTER_KEY = 'invoiceCounter';
const YEAR_KEY = 'invoiceYear';

export function getNextInvoiceNumber(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const storedYear = parseInt(localStorage.getItem(YEAR_KEY) ?? '0', 10);
  let counter = parseInt(localStorage.getItem(COUNTER_KEY) ?? '0', 10);
  
  if (storedYear !== currentYear) {
    counter = 0;
    localStorage.setItem(YEAR_KEY, String(currentYear));
  }
  
  counter += 1;
  localStorage.setItem(COUNTER_KEY, String(counter));
  return `${currentYear}-${String(counter).padStart(4, '0')}`;
}

export function peekNextInvoiceNumber(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const storedYear = parseInt(localStorage.getItem(YEAR_KEY) ?? '0', 10);
  let counter = parseInt(localStorage.getItem(COUNTER_KEY) ?? '0', 10);
  if (storedYear !== currentYear) counter = 0;
  return `${currentYear}-${String(counter + 1).padStart(4, '0')}`;
}

export function resetInvoiceCounter(): void {
  localStorage.removeItem(COUNTER_KEY);
  localStorage.removeItem(YEAR_KEY);
}
