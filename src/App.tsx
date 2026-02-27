import { lazy, Suspense, useEffect, useState } from 'react';
import { ThemeToggle } from './components/ThemeToggle';
import { loadInvoices, loadTheme, saveTheme, upsertInvoice } from './lib/storage';
import type { Invoice } from './types/invoice';

const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const Editor = lazy(() => import('./pages/Editor').then((module) => ({ default: module.Editor })));

type View = 'dashboard' | 'editor';

function App() {
  const [view, setView] = useState<View>('dashboard');
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadInvoices());
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadTheme());

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    saveTheme(theme);
  }, [theme]);

  const preloadCreateFlow = () => {
    void import('./pages/Editor');
    void import('./lib/defaults');
  };

  const handleCreate = async () => {
    const { createDefaultInvoice } = await import('./lib/defaults');
    setCurrentInvoice(createDefaultInvoice());
    setView('editor');
  };

  const handleOpen = (invoiceId: string) => {
    const selected = invoices.find((invoice) => invoice.id === invoiceId);
    if (!selected) return;
    setCurrentInvoice(structuredClone(selected));
    setView('editor');
  };

  const handleSave = (invoice: Invoice) => {
    const updated = upsertInvoice(invoice);
    setInvoices(updated);
    setCurrentInvoice(null);
    setView('dashboard');
  };

  return (
    <main className="mx-auto max-w-7xl p-4 text-[#202020]">
      <header className="mb-6 flex flex-col gap-3 rounded-lg border border-[#E0E0E0] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Factures Résonance</h1>
          <p className="text-sm text-[#505050]">MVP facturation locale (éditeur + tableau de bord + PDF)</p>
        </div>
        <ThemeToggle
          theme={theme}
          onToggle={() => setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))}
        />
      </header>

      <Suspense
        fallback={
          <section className="rounded-lg border border-[#E0E0E0] bg-white p-6 text-sm text-[#505050] shadow-sm">
            Chargement…
          </section>
        }
      >
        {view === 'dashboard' ? (
          <Dashboard
            invoices={invoices}
            onCreate={handleCreate}
            onPrepareCreate={preloadCreateFlow}
            onOpen={handleOpen}
            onInvoicesImported={setInvoices}
          />
        ) : currentInvoice ? (
          <Editor
            invoice={currentInvoice}
            onChange={setCurrentInvoice}
            onSave={handleSave}
            onBack={() => {
              setCurrentInvoice(null);
              setView('dashboard');
            }}
          />
        ) : null}
      </Suspense>
    </main>
  );
}

export default App;
