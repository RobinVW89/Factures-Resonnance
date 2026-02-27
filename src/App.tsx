import { lazy, Suspense, useEffect, useState } from 'react';
import { ThemeToggle } from './components/ThemeToggle';
import { loadInvoicesFromCloud, syncInvoicesToCloud } from './lib/cloudSync';
import { loadInvoices, loadTheme, saveInvoices, saveTheme, upsertInvoice } from './lib/storage';
import type { Invoice } from './types/invoice';

const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const Editor = lazy(() => import('./pages/Editor').then((module) => ({ default: module.Editor })));

type View = 'dashboard' | 'editor';
type SyncState = 'idle' | 'syncing' | 'ok' | 'error';

function App() {
	const initialInvoices = loadInvoices();
  const [view, setView] = useState<View>('dashboard');
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadTheme());
  const [syncState, setSyncState] = useState<SyncState>('idle');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    const syncOnBoot = async () => {
      setSyncState('syncing');
      const remoteInvoices = await loadInvoicesFromCloud();
      if (cancelled) return;
      if (!remoteInvoices) {
        setSyncState('error');
        return;
      }

      if (remoteInvoices.length > 0 || initialInvoices.length === 0) {
        saveInvoices(remoteInvoices);
        setInvoices(remoteInvoices);
      }

      setSyncState('ok');
    };

    void syncOnBoot();

    return () => {
      cancelled = true;
    };
  }, [initialInvoices.length]);

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
    setSyncState('syncing');
    void syncInvoicesToCloud(updated).then((ok) => setSyncState(ok ? 'ok' : 'error'));
    setCurrentInvoice(null);
    setView('dashboard');
  };

	const handleInvoicesImported = (updatedInvoices: Invoice[]) => {
		setInvoices(updatedInvoices);
		setSyncState('syncing');
		void syncInvoicesToCloud(updatedInvoices).then((ok) => setSyncState(ok ? 'ok' : 'error'));
	};

  const syncLabel =
    syncState === 'ok'
      ? 'Sync cloud OK'
      : syncState === 'syncing'
        ? 'Sync cloud…'
        : syncState === 'error'
          ? 'Sync cloud KO'
          : 'Sync cloud local';

  return (
    <main className={`app-shell mx-auto max-w-7xl p-4 text-[#202020] ${theme === 'dark' ? 'theme-dark' : ''}`}>
      <header className="mb-6 flex flex-col gap-3 rounded-lg border border-[#E0E0E0] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Factures Résonance</h1>
          <p className="text-sm text-[#505050]">MVP facturation locale (éditeur + tableau de bord + PDF)</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-2 py-1 text-xs font-medium ${
              syncState === 'ok'
                ? 'border-[#B9CC92] bg-[#F0F8F0] text-[#2D4D16]'
                : syncState === 'error'
                  ? 'border-[#E8B4B4] bg-[#FFF4F4] text-[#7A1C1C]'
                  : 'border-[#E0E0E0] bg-white text-[#505050]'
            }`}
            title="État de la sauvegarde cloud"
          >
            {syncLabel}
          </span>
          <ThemeToggle
            theme={theme}
            onToggle={() => setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))}
          />
        </div>
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
            onInvoicesImported={handleInvoicesImported}
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
