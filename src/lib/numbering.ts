import type { NumberingSettings } from '../types/invoice';

const COUNTER_KEY = 'fr.numbering.counter';
const YEAR_KEY = 'fr.numbering.year';
const SETTINGS_KEY = 'fr.numbering.settings';

const defaultSettings: NumberingSettings = {
  pattern: 'AAAA-####',
  resetEachYear: true,
};

export const getNumberingSettings = (): NumberingSettings => {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaultSettings;

  try {
    const parsed = JSON.parse(raw) as Partial<NumberingSettings>;
    return {
      pattern: parsed.pattern || defaultSettings.pattern,
      resetEachYear: parsed.resetEachYear ?? defaultSettings.resetEachYear,
    };
  } catch {
    return defaultSettings;
  }
};

export const saveNumberingSettings = (settings: NumberingSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

const formatNumber = (pattern: string, year: number, counter: number): string => {
  const digitsMatch = pattern.match(/#+/);
  const digits = digitsMatch?.[0].length ?? 4;
  const paddedCounter = String(counter).padStart(digits, '0');
  return pattern.replace('AAAA', String(year)).replace(/#+/, paddedCounter);
};

export const getNextInvoiceNumber = (referenceDate: Date = new Date()): string => {
  const settings = getNumberingSettings();
  const year = referenceDate.getFullYear();

  const savedYear = Number(localStorage.getItem(YEAR_KEY) || year);
  const savedCounter = Number(localStorage.getItem(COUNTER_KEY) || 0);

  const shouldReset = settings.resetEachYear && savedYear !== year;
  const nextCounter = shouldReset ? 1 : savedCounter + 1;

  localStorage.setItem(COUNTER_KEY, String(nextCounter));
  localStorage.setItem(YEAR_KEY, String(year));

  return formatNumber(settings.pattern, year, nextCounter);
};

export const previewInvoiceNumber = (counter: number, referenceDate: Date = new Date()): string => {
  const settings = getNumberingSettings();
  return formatNumber(settings.pattern, referenceDate.getFullYear(), counter);
};
