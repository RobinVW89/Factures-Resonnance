import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Invoice } from '../types/invoice';
import { loadInvoices, saveInvoices, exportInvoicesJSON, importInvoicesJSON } from '../lib/storage';
import { getNextInvoiceNumber } from '../lib/invoiceNumber';
import { formatCurrency } from '../lib/formatters';
import InvoiceList from '../components/InvoiceList';
import ThemeToggle from '../components/ThemeToggle';

export default function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'date' | 'number' | 'customer' | 'total'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'payée' | 'à payer'>('all');

  useEffect(() => {
    setInvoices(loadInvoices());
  }, []);

  const persist = (updated: Invoice[]) => {
    setInvoices(updated);
    saveInvoices(updated);
  };

  const handleDelete = (id: string) => {
    persist(invoices.filter(inv => inv.id !== id));
  };

  const handleDuplicate = (id: string) => {
    const src = invoices.find(inv => inv.id === id);
    if (!src) return;
    const copy: Invoice = {
      ...src,
      id: crypto.randomUUID(),
      number: getNextInvoiceNumber(),
      date: new Date().toISOString().substring(0, 10),
      payment: { status: 'à payer' },
    };
    persist([copy, ...invoices]);
  };

  const handleExport = () => exportInvoicesJSON(invoices);

  const handleImport = async () => {
    const imported = await importInvoicesJSON();
    if (imported.length > 0) {
      const merged = [...invoices];
      for (const inv of imported) {
        if (!merged.find(i => i.id === inv.id)) merged.push(inv);
      }
      persist(merged);
    }
  };

  const filtered = useMemo(() => {
    let list = invoices;
    if (filterStatus !== 'all') {
      list = list.filter(inv => inv.payment.status === filterStatus);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(inv =>
        inv.number.toLowerCase().includes(q) ||
        inv.customer.name.toLowerCase().includes(q) ||
        inv.customer.address.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortField === 'number') cmp = a.number.localeCompare(b.number);
      else if (sortField === 'customer') cmp = a.customer.name.localeCompare(b.customer.name);
      else if (sortField === 'total') cmp = a.totals.grandTotal - b.totals.grandTotal;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [invoices, search, sortField, sortDir, filterStatus]);

  const stats = useMemo(() => {
    const paid = invoices.filter(i => i.payment.status === 'payée');
    const unpaid = invoices.filter(i => i.payment.status === 'à payer');
    return {
      total: invoices.length,
      paidCount: paid.length,
      unpaidCount: unpaid.length,
      paidAmount: paid.reduce((s, i) => s + i.totals.grandTotal, 0),
      unpaidAmount: unpaid.reduce((s, i) => s + i.totals.grandTotal, 0),
    };
  }, [invoices]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-blue-900 dark:text-blue-300">📋 Factures Résonance</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Association RÉSONANCE ICAUNAISE</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={handleImport}
              className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Importer
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Exporter
            </button>
            <Link
              to="/new"
              className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors text-sm font-medium"
            >
              + Nouvelle facture
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total factures</p>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Payées</p>
            <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">{stats.paidCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(stats.paidAmount)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">À payer</p>
            <p className="text-2xl font-bold mt-1 text-orange-600 dark:text-orange-400">{stats.unpaidCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(stats.unpaidAmount)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total encaissé</p>
            <p className="text-2xl font-bold mt-1 text-blue-700 dark:text-blue-400">{formatCurrency(stats.paidAmount)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="search"
              placeholder="Rechercher par numéro, client..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
            />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm focus:outline-none dark:text-gray-100"
            >
              <option value="all">Tous les statuts</option>
              <option value="payée">Payées</option>
              <option value="à payer">À payer</option>
            </select>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              Trier par :
              {(['date', 'number', 'customer', 'total'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleSort(f)}
                  className={`px-2 py-1 rounded text-xs ${sortField === f ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  {f === 'date' ? 'Date' : f === 'number' ? 'N°' : f === 'customer' ? 'Client' : 'Montant'}
                  {sortField === f && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <InvoiceList
            invoices={filtered}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
        </div>
      </main>
    </div>
  );
}
