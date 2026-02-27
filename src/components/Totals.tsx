import type { Totals as TotalsType } from '../types/invoice';
import { formatCurrency } from '../lib/formatters';

interface Props {
  totals: TotalsType;
  onVatPctChange?: (vat: number) => void;
  editable?: boolean;
}

export default function Totals({ totals, onVatPctChange, editable = false }: Props) {
  return (
    <div className="flex justify-end">
      <div className="w-64 text-sm">
        <div className="flex justify-between py-1 border-b dark:border-gray-600">
          <span className="text-gray-600 dark:text-gray-400">Total HT</span>
          <span className="font-medium dark:text-gray-100">{formatCurrency(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between py-1 border-b dark:border-gray-600 items-center">
          <span className="text-gray-600 dark:text-gray-400">
            TVA{' '}
            {editable && onVatPctChange ? (
              <input
                type="number"
                min="0"
                max="100"
                value={totals.vatPct}
                onChange={e => onVatPctChange(parseFloat(e.target.value) || 0)}
                className="w-12 border-b border-gray-300 bg-transparent text-right focus:outline-none"
                aria-label="Taux TVA"
              />
            ) : (
              totals.vatPct
            )}
            %
          </span>
          <span className="dark:text-gray-100">{formatCurrency(totals.vatAmount)}</span>
        </div>
        {totals.vatPct === 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 italic my-1">
            T.V.A. non applicable, art. 293 B du CGI
          </p>
        )}
        <div className="flex justify-between py-2 font-bold text-blue-900 dark:text-blue-300 text-base border-t-2 border-blue-900 dark:border-blue-400 mt-1">
          <span>Total TTC</span>
          <span>{formatCurrency(totals.grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
