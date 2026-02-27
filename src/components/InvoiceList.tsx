import type { Invoice } from '../types/invoice';
import { formatCurrency, formatDate } from '../lib/formatters';
import { Link } from 'react-router-dom';

interface Props {
  invoices: Invoice[];
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export default function InvoiceList({ invoices, onDelete, onDuplicate }: Props) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-500">
        <p className="text-5xl mb-4">📄</p>
        <p className="text-lg font-medium">Aucune facture</p>
        <p className="text-sm mt-1">Créez votre première facture en cliquant sur « Nouvelle facture »</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-gray-200 dark:border-gray-700 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            <th className="pb-2 pr-4">Numéro</th>
            <th className="pb-2 pr-4">Date</th>
            <th className="pb-2 pr-4">Client</th>
            <th className="pb-2 pr-4 text-right">Montant TTC</th>
            <th className="pb-2 pr-4">Statut</th>
            <th className="pb-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {invoices.map(inv => (
            <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <td className="py-3 pr-4 font-mono font-medium text-blue-700 dark:text-blue-400">{inv.number}</td>
              <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{formatDate(inv.date)}</td>
              <td className="py-3 pr-4 font-medium dark:text-gray-100">{inv.customer.name}</td>
              <td className="py-3 pr-4 text-right font-semibold dark:text-gray-100">{formatCurrency(inv.totals.grandTotal)}</td>
              <td className="py-3 pr-4">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  inv.payment.status === 'payée'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                }`}>
                  {inv.payment.status === 'payée' ? '✓ Payée' : '⏳ À payer'}
                </span>
              </td>
              <td className="py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    to={`/edit/${inv.id}`}
                    className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    Modifier
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDuplicate(inv.id)}
                    className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Dupliquer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Supprimer la facture ${inv.number} ?`)) {
                        onDelete(inv.id);
                      }
                    }}
                    className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
