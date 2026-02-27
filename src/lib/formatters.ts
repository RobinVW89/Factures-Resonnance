export function formatAmount(n: number): string {
  const parts = n.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
  return `${intPart},${parts[1]}\u00a0€`;
}

export function formatDate(isoString: string): string {
  if (!isoString) return '';
  const [y, m, d] = isoString.split('-');
  return `${d}/${m}/${y}`;
}

export function parseAmount(s: string): number {
  return parseFloat(s.replace(/\u202f/g, '').replace(',', '.').replace(/\u00a0€/g, '').trim());
}
