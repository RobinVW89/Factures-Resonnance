import { memo } from 'react';
import type { Invoice } from '../types/invoice';
import { formatCurrency, formatDate } from '../lib/formatters';

type DashboardTableProps = {
  invoices: Invoice[];
  search: string;
  sortBy: 'number' | 'client' | 'date' | 'status';
  onSearchChange: (value: string) => void;
  onSortChange: (value: 'number' | 'client' | 'date' | 'status') => void;
  onOpen: (invoiceId: string) => void;
};

function DashboardTableComponent({
  invoices,
  search,
  sortBy,
  onSearchChange,
  onSortChange,
  onOpen,
}: DashboardTableProps) {
  return (
    <section className="rounded-lg border border-[#E0E0E0] bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Rechercher n°, client, date, statut"
          className="w-full rounded-md border border-[#E0E0E0] bg-white px-3 py-2 text-sm md:max-w-md"
          aria-label="Rechercher une facture"
        />
        <select
          value={sortBy}
          onChange={(event) => onSortChange(event.target.value as 'number' | 'client' | 'date' | 'status')}
          className="rounded-md border border-[#E0E0E0] bg-white px-3 py-2 text-sm"
          aria-label="Trier les factures"
        >
          <option value="date">Tri : Date</option>
          <option value="number">Tri : Numéro</option>
          <option value="client">Tri : Client</option>
          <option value="status">Tri : Statut</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[#D8D8D8] bg-[#F0F8F0] text-left">
              <th className="pb-2 pr-3">N°</th>
              <th className="pb-2 pr-3">Client</th>
              <th className="pb-2 pr-3">Date</th>
              <th className="pb-2 pr-3">Statut</th>
              <th className="pb-2 pr-3">Montant</th>
              <th className="pb-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-[#F0F0F0]">
                <td className="py-2 pr-3">{invoice.number}</td>
                <td className="py-2 pr-3">{invoice.customer.name}</td>
                <td className="py-2 pr-3">{formatDate(invoice.date)}</td>
                <td className="py-2 pr-3">{invoice.payment.status}</td>
                <td className="py-2 pr-3">{formatCurrency(invoice.totals.grandTotal)}</td>
                <td className="py-2">
                  <button
                    type="button"
                    onClick={() => onOpen(invoice.id)}
                    className="rounded-md border border-[#E0E0E0] bg-white px-2 py-1 text-xs hover:bg-[#F8F8F8]"
                  >
                    Ouvrir
                  </button>
                </td>
              </tr>
            ))}
            {!invoices.length && (
              <tr>
                <td colSpan={6} className="py-5 text-center text-[#606060]">
                  Aucune facture.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export const DashboardTable = memo(DashboardTableComponent);
