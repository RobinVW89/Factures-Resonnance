import { formatAmount } from '../lib/formatters';

interface Totals {
  subtotal: number;
  vatPct: number;
  vatAmount: number;
  grandTotal: number;
}

interface Props {
  totals: Totals;
  onVatChange: (vatPct: number) => void;
}

export default function TotalsBlock({ totals, onVatChange }: Props) {
  const rowClass = "flex justify-between items-center py-1";
  const labelClass = "text-sm text-gray-600 dark:text-gray-400";
  const valueClass = "text-sm font-medium text-gray-800 dark:text-gray-200";

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded p-4 mb-4 max-w-xs ml-auto">
      <div className={rowClass}>
        <span className={labelClass}>Sous-total HT</span>
        <span className={valueClass}>{formatAmount(totals.subtotal)}</span>
      </div>
      <div className={rowClass}>
        <label className={labelClass}>TVA</label>
        <select
          value={totals.vatPct}
          onChange={e => onVatChange(parseFloat(e.target.value))}
          className="ml-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-0.5 text-sm"
        >
          <option value={0}>0%</option>
          <option value={5.5}>5,5%</option>
          <option value={10}>10%</option>
          <option value={20}>20%</option>
        </select>
      </div>
      {totals.vatPct === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic my-1">
          T.V.A. non applicable, article 293 B du CGI
        </p>
      ) : (
        <div className={rowClass}>
          <span className={labelClass}>TVA ({totals.vatPct}%)</span>
          <span className={valueClass}>{formatAmount(totals.vatAmount)}</span>
        </div>
      )}
      <div className="border-t border-gray-300 dark:border-gray-600 mt-2 pt-2 flex justify-between items-center">
        <span className="text-base font-bold text-gray-800 dark:text-gray-100">TOTAL TTC</span>
        <span className="text-base font-bold text-blue-700 dark:text-blue-400">{formatAmount(totals.grandTotal)}</span>
      </div>
    </div>
  );
}
