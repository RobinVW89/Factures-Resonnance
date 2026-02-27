const COUNTER_KEY = 'invoice_counter';

export function getNextNumber(): string {
  const currentYear = new Date().getFullYear();
  let counter = { year: currentYear, count: 0 };
  const stored = localStorage.getItem(COUNTER_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed.year === currentYear) {
      counter = parsed;
    }
  }
  counter.count += 1;
  localStorage.setItem(COUNTER_KEY, JSON.stringify(counter));
  return `${currentYear}-${String(counter.count).padStart(4, '0')}`;
}

export function peekNextNumber(): string {
  const currentYear = new Date().getFullYear();
  let count = 0;
  const stored = localStorage.getItem(COUNTER_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed.year === currentYear) {
      count = parsed.count;
    }
  }
  return `${currentYear}-${String(count + 1).padStart(4, '0')}`;
}
