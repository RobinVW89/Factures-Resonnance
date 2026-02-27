import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Invoice, Party, Item, Payment } from '../types/invoice';
import { loadInvoices, saveInvoices } from '../lib/storage';
import { getNextInvoiceNumber } from '../lib/invoiceNumber';
import { calcTotals, todayISO } from '../lib/formatters';
import ItemsTable from '../components/ItemsTable';
import Totals from '../components/Totals';
import InvoicePreview from '../components/InvoicePreview';
import PdfDownloader from '../components/PdfDownloader';
import LogoUpload from '../components/LogoUpload';
import ThemeToggle from '../components/ThemeToggle';

const DEFAULT_ISSUER: Party = {
  name: 'Association RÉSONANCE ICAUNAISE',
  tagline: 'Le Business Ensemble',
  address: '2 rue des chariats, 89290 IRANCY',
  legalMentions: "Association Loi 1901, enregistrée à la préfecture d'Auxerre.",
};

const emptyInvoice = (): Invoice => ({
  id: crypto.randomUUID(),
  number: getNextInvoiceNumber(),
  date: todayISO(),
  issuer: { ...DEFAULT_ISSUER },
  customer: { name: '', address: '' },
  items: [{ description: '', quantity: 1, unitPrice: 0 }],
  totals: { subtotal: 0, vatPct: 0, vatAmount: 0, grandTotal: 0 },
  payment: { status: 'à payer' },
  currency: 'EUR',
});

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
      <h2 className="text-sm font-semibold text-blue-900 dark:text-blue-300 uppercase tracking-wide mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label, value, onChange, type = 'text', placeholder, required, rows
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}) {
  const cls = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100";
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {rows ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          required={required}
          className={cls}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={cls}
        />
      )}
    </div>
  );
}

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (id) {
      const invoices = loadInvoices();
      const found = invoices.find(inv => inv.id === id);
      if (found) setInvoice(found);
      else setInvoice(emptyInvoice());
    } else {
      setInvoice(emptyInvoice());
    }
  }, [id]);

  const updateItems = useCallback((items: Item[]) => {
    setInvoice(prev => {
      if (!prev) return prev;
      const totals = calcTotals(items, prev.totals.vatPct);
      return { ...prev, items, totals };
    });
  }, []);

  const updateVat = useCallback((vatPct: number) => {
    setInvoice(prev => {
      if (!prev) return prev;
      const totals = calcTotals(prev.items, vatPct);
      return { ...prev, totals };
    });
  }, []);

  const setIssuerField = (field: keyof Party, value: string) => {
    setInvoice(prev => prev ? { ...prev, issuer: { ...prev.issuer, [field]: value } } : prev);
  };

  const setCustomerField = (field: keyof Party, value: string) => {
    setInvoice(prev => prev ? { ...prev, customer: { ...prev.customer, [field]: value } } : prev);
  };

  const setPaymentField = (field: keyof Payment, value: string) => {
    setInvoice(prev => prev ? { ...prev, payment: { ...prev.payment, [field]: value } } : prev);
  };

  const setField = <K extends keyof Invoice>(field: K, value: Invoice[K]) => {
    setInvoice(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleSave = () => {
    if (!invoice) return;
    const invoices = loadInvoices();
    const idx = invoices.findIndex(i => i.id === invoice.id);
    if (idx >= 0) invoices[idx] = invoice;
    else invoices.unshift(invoice);
    saveInvoices(invoices);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveAndBack = () => {
    if (!invoice) return;
    const invoices = loadInvoices();
    const idx = invoices.findIndex(i => i.id === invoice.id);
    if (idx >= 0) invoices[idx] = invoice;
    else invoices.unshift(invoice);
    saveInvoices(invoices);
    navigate('/');
  };

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm">← Retour</Link>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <h1 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
              {id ? `Modifier la facture ${invoice.number}` : 'Nouvelle facture'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 transition-colors"
            >
              {showPreview ? 'Masquer aperçu' : 'Aperçu'}
            </button>
            {invoice && <PdfDownloader invoice={invoice} label="PDF" className="text-sm py-2" />}
            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              {saved ? '✓ Enregistré' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={handleSaveAndBack}
              className="px-3 py-2 text-sm bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors"
            >
              Enregistrer et fermer
            </button>
          </div>
        </div>
      </header>

      <div className={`max-w-7xl mx-auto px-4 py-6 ${showPreview ? 'grid grid-cols-2 gap-6' : ''}`}>
        {/* Form */}
        <div className="space-y-4">
          {/* Section 1: Invoice info */}
          <SectionCard title="Informations de la facture">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field
                label="Numéro de facture"
                value={invoice.number}
                onChange={v => setField('number', v)}
                required
              />
              <Field
                label="Date"
                value={invoice.date}
                onChange={v => setField('date', v)}
                type="date"
                required
              />
              <Field
                label="Date d'échéance"
                value={invoice.dueDate ?? ''}
                onChange={v => setField('dueDate', v || undefined)}
                type="date"
              />
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Statut paiement <span className="text-red-500">*</span>
                </label>
                <select
                  value={invoice.payment.status}
                  onChange={e => setPaymentField('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
                >
                  <option value="à payer">À payer</option>
                  <option value="payée">Payée</option>
                </select>
              </div>
              {invoice.payment.status === 'payée' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mode de paiement</label>
                    <select
                      value={invoice.payment.method ?? ''}
                      onChange={e => setPaymentField('method', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
                    >
                      <option value="">--</option>
                      <option value="chèque">Chèque</option>
                      <option value="virement">Virement</option>
                      <option value="CB">CB</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <Field
                    label="Date de paiement"
                    value={invoice.payment.paidOn ?? ''}
                    onChange={v => setPaymentField('paidOn', v)}
                    type="date"
                  />
                </>
              )}
            </div>
          </SectionCard>

          {/* Section 2: Issuer */}
          <SectionCard title="Émetteur (votre organisation)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nom / Raison sociale" value={invoice.issuer.name} onChange={v => setIssuerField('name', v)} required />
              <Field label="Slogan / Tagline" value={invoice.issuer.tagline ?? ''} onChange={v => setIssuerField('tagline', v)} placeholder="ex. Le Business Ensemble" />
              <div className="md:col-span-2">
                <Field label="Adresse" value={invoice.issuer.address} onChange={v => setIssuerField('address', v)} required rows={2} />
              </div>
              <Field label="SIREN / SIRET" value={invoice.issuer.sirenOrSiret ?? ''} onChange={v => setIssuerField('sirenOrSiret', v)} placeholder="ex. 123 456 789 00012" />
              <Field label="Email" value={invoice.issuer.email ?? ''} onChange={v => setIssuerField('email', v)} type="email" />
              <Field label="Téléphone" value={invoice.issuer.phone ?? ''} onChange={v => setIssuerField('phone', v)} type="tel" />
              <div className="md:col-span-2">
                <Field label="Mentions légales" value={invoice.issuer.legalMentions ?? ''} onChange={v => setIssuerField('legalMentions', v)} rows={2} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Logo</label>
                <LogoUpload
                  value={invoice.issuer.logoDataUrl}
                  onChange={v => setIssuerField('logoDataUrl', v ?? '')}
                />
              </div>
            </div>
          </SectionCard>

          {/* Section 3: Customer */}
          <SectionCard title="Client">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nom / Raison sociale" value={invoice.customer.name} onChange={v => setCustomerField('name', v)} required />
              <Field label="SIREN / SIRET" value={invoice.customer.sirenOrSiret ?? ''} onChange={v => setCustomerField('sirenOrSiret', v)} />
              <div className="md:col-span-2">
                <Field label="Adresse" value={invoice.customer.address} onChange={v => setCustomerField('address', v)} required rows={2} />
              </div>
              <Field label="Email" value={invoice.customer.email ?? ''} onChange={v => setCustomerField('email', v)} type="email" />
              <Field label="Téléphone" value={invoice.customer.phone ?? ''} onChange={v => setCustomerField('phone', v)} type="tel" />
            </div>
          </SectionCard>

          {/* Section 4: Items */}
          <SectionCard title="Lignes de la facture">
            <ItemsTable items={invoice.items} onChange={updateItems} />
            <div className="mt-4">
              <Totals totals={invoice.totals} onVatPctChange={updateVat} editable />
            </div>
          </SectionCard>

          {/* Section 5: Notes & Signature */}
          <SectionCard title="Notes et signature">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field
                  label="Notes / Commentaires"
                  value={invoice.notes ?? ''}
                  onChange={v => setField('notes', v || undefined)}
                  rows={3}
                  placeholder="Informations complémentaires, conditions de paiement..."
                />
              </div>
              <Field label="Nom du signataire" value={invoice.signatureName ?? ''} onChange={v => setField('signatureName', v || undefined)} />
              <Field label="Titre du signataire" value={invoice.signatureTitle ?? ''} onChange={v => setField('signatureTitle', v || undefined)} />
            </div>
          </SectionCard>
        </div>

        {/* Preview panel */}
        {showPreview && (
          <div className="overflow-auto max-h-[calc(100vh-80px)] sticky top-20">
            <div className="scale-[0.6] origin-top-left" style={{ width: '166.67%' }}>
              <InvoicePreview invoice={invoice} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
