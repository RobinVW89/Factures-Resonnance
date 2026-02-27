import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadInvoices, deleteInvoice, exportJSON, importJSON } from '../lib/storage';
import type { Invoice } from '../types/invoice';
import { formatAmount, formatDate } from '../lib/formatters';

type SortField = 'number' | 'client' | 'date' | 'status';
type SortDir = 'asc' | 'desc';

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    return stored === 'true';
  });
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(dark));
  }, [dark]);
  return [dark, setDark] as const;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [dark, setDark] = useDarkMode();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    setInvoices(loadInvoices());
  }, []);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = invoices
    .filter(inv => {
      const q = search.toLowerCase();
      return (
        inv.number.toLowerCase().includes(q) ||
        inv.customer.name.toLowerCase().includes(q) ||
        inv.date.includes(q)
      );
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'number') cmp = a.number.localeCompare(b.number);
      else if (sortField === 'client') cmp = a.customer.name.localeCompare(b.customer.name);
      else if (sortField === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortField === 'status') cmp = a.payment.status.localeCompare(b.payment.status);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Supprimer cette facture ?')) {
      deleteInvoice(id);
      setInvoices(loadInvoices());
    }
  };

  const handleExport = () => {
    const json = exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'factures.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        importJSON(text);
        setInvoices(loadInvoices());
      } catch {
        alert('Erreur lors de l\'importation du fichier JSON.');
      }
    };
    input.click();
  };

  const thClass = (field: SortField) =>
    `px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-blue-700 select-none ${sortField === field ? 'text-yellow-300' : 'text-gray-200'}`;

  const sortArrow = (field: SortField) =>
    sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="bg-blue-800 dark:bg-blue-900 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Factures Résonance</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/new')}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-medium text-sm"
            >
              + Nouvelle facture
            </button>
            <button
              onClick={handleImport}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
            >
              Importer JSON
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
            >
              Exporter JSON
            </button>
            <button
              onClick={() => setDark(d => !d)}
              className="px-3 py-2 bg-blue-700 hover:bg-blue-600 rounded text-sm"
              title="Basculer le mode sombre"
            >
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="mb-4">
          <input
            type="search"
            placeholder="Rechercher par numéro, client, date..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-md rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-blue-800 dark:bg-blue-900">
              <tr>
                <th className={thClass('number')} onClick={() => handleSort('number')}>
                  N°{sortArrow('number')}
                </th>
                <th className={thClass('client')} onClick={() => handleSort('client')}>
                  Client{sortArrow('client')}
                </th>
                <th className={thClass('date')} onClick={() => handleSort('date')}>
                  Date{sortArrow('date')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-200">
                  Montant
                </th>
                <th className={thClass('status')} onClick={() => handleSort('status')}>
                  Statut{sortArrow('status')}
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    {search ? 'Aucune facture ne correspond à votre recherche.' : 'Aucune facture. Cliquez sur « + Nouvelle facture » pour commencer.'}
                  </td>
                </tr>
              ) : (
                filtered.map(inv => (
                  <tr
                    key={inv.id}
                    className="hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => navigate(`/edit/${inv.id}`)}
                  >
                    <td className="px-4 py-3 font-mono font-medium">{inv.number}</td>
                    <td className="px-4 py-3">{inv.customer.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(inv.date)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatAmount(inv.totals.grandTotal)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        inv.payment.status === 'payée'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {inv.payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => handleDelete(inv.id, e)}
                        className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            {filtered.length} facture{filtered.length > 1 ? 's' : ''}
            {' — '}Total : {formatAmount(filtered.reduce((s, inv) => s + inv.totals.grandTotal, 0))}
          </p>
        )}
      </main>
    </div>
  );
}
