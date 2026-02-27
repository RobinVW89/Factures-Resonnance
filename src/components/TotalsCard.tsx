import { memo } from 'react';
import type { Invoice } from '../types/invoice';
import { formatCurrency } from '../lib/formatters';

type TotalsCardProps = {
  totals: Invoice['totals'];
};

function TotalsCardComponent({ totals }: TotalsCardProps) {
  return (
    <div className="rounded-lg border border-[#E0E0E0] bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#404040]">Totaux</h3>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt>Sous-total HT</dt>
          <dd>{formatCurrency(totals.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>TVA ({(totals.vatPct * 100).toFixed(0)}%)</dt>
          <dd>{formatCurrency(totals.vatAmount)}</dd>
        </div>
        <div className="flex justify-between rounded-md border border-[#B9CC92] bg-[#F0F8F0] px-2 py-2 text-base font-semibold">
          <dt>Total TTC</dt>
          <dd>{formatCurrency(totals.grandTotal)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-[#606060]">T.V.A. non applicable, article 293 B du CGI.</p>
    </div>
  );
}

export const TotalsCard = memo(TotalsCardComponent);
