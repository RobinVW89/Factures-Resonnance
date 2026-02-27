import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { Invoice, Party, Item, Payment } from '../types/invoice';
import { loadInvoices, saveInvoice, loadLogo, saveLogo } from '../lib/storage';
import { computeTotals } from '../lib/totals';
import { peekNextNumber, getNextNumber } from '../lib/numbering';
import { formatAmount, formatDate } from '../lib/formatters';
import { generatePDF } from '../lib/pdf';
import PartyForm from '../components/PartyForm';
import ItemsTable from '../components/ItemsTable';
import TotalsBlock from '../components/TotalsBlock';

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

const DEFAULT_ISSUER: Party = {
  name: 'Association RÉSONANCE ICAUNAISE',
  tagline: 'Le Business Ensemble',
  address: '2 rue des chariats, 89290 IRANCY',
  legalMentions: "Association Loi 1901, enregistrée à la préfecture d'Auxerre.",
};

const DEFAULT_CUSTOMER: Party = {
  name: 'LG Courtage & J3G Patrimoine',
  sirenOrSiret: '839 824 651',
  address: '13 rue de l\'horloge, 89000 Auxerre',
};

function InvoicePreview({ invoice, logo }: { invoice: Invoice; logo: string | null }) {
  const { issuer, customer, items, totals, payment, notes, signatureName, signatureTitle } = invoice;

  return (
    <div className="bg-white text-gray-900 p-8 shadow-lg rounded text-sm" style={{ fontFamily: 'Arial, sans-serif', minHeight: '297mm' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">FACTURE</h1>
        </div>
        {logo && (
          <img src={logo} alt="Logo" className="max-h-16 max-w-36 object-contain" />
        )}
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <p className="font-bold text-base">{issuer.name}</p>
          {issuer.tagline && <p className="text-gray-500 text-xs">{issuer.tagline}</p>}
          {issuer.address.split('\n').map((l, i) => <p key={i} className="text-xs">{l}</p>)}
          {issuer.email && <p className="text-xs">{issuer.email}</p>}
          {issuer.phone && <p className="text-xs">{issuer.phone}</p>}
          {issuer.sirenOrSiret && <p className="text-xs">SIREN/SIRET : {issuer.sirenOrSiret}</p>}
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase mb-1">Facturé à :</p>
          <p className="font-bold text-base">{customer.name}</p>
          {customer.sirenOrSiret && <p className="text-xs">SIREN/SIRET : {customer.sirenOrSiret}</p>}
          {customer.address.split('\n').map((l, i) => <p key={i} className="text-xs">{l}</p>)}
          {customer.email && <p className="text-xs">{customer.email}</p>}
        </div>
      </div>

      <hr className="border-gray-300 mb-4" />

      {/* Invoice info */}
      <div className="flex gap-8 mb-6">
        <div><span className="font-bold">Facture N° :</span> {invoice.number}</div>
        <div><span className="font-bold">Date :</span> {formatDate(invoice.date)}</div>
        {invoice.dueDate && <div><span className="font-bold">Échéance :</span> {formatDate(invoice.dueDate)}</div>}
      </div>

      {/* Items table */}
      <table className="w-full text-xs mb-4 border-collapse">
        <thead>
          <tr className="bg-blue-900 text-white">
            <th className="px-3 py-2 text-left">Désignation</th>
            <th className="px-3 py-2 text-right">Qté</th>
            <th className="px-3 py-2 text-right">PU (€)</th>
            <th className="px-3 py-2 text-right">Total (€)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const discount = item.discountPct ?? 0;
            const lineTotal = item.quantity * item.unitPrice * (1 - discount / 100);
            return (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-1.5">
                  {item.description}
                  {discount > 0 && <span className="ml-2 text-red-600 text-xs">(-{discount}%)</span>}
                </td>
                <td className="px-3 py-1.5 text-right">{item.quantity}</td>
                <td className="px-3 py-1.5 text-right">{formatAmount(item.unitPrice)}</td>
                <td className="px-3 py-1.5 text-right font-medium">{formatAmount(lineTotal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-4">
        <div className="w-56">
          <div className="flex justify-between py-1 text-xs">
            <span>Sous-total HT</span>
            <span>{formatAmount(totals.subtotal)}</span>
          </div>
          {totals.vatPct === 0 ? (
            <p className="text-xs text-gray-500 italic">T.V.A. non applicable, art. 293 B du CGI</p>
          ) : (
            <div className="flex justify-between py-1 text-xs">
              <span>TVA ({totals.vatPct}%)</span>
              <span>{formatAmount(totals.vatAmount)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t border-gray-400 font-bold">
            <span>TOTAL TTC</span>
            <span className="text-blue-900">{formatAmount(totals.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Payment */}
      <div className="mb-4">
        {payment.status === 'payée' ? (
          <p className="text-green-700 font-bold text-sm">
            ✓ Réglée{payment.method ? ` par ${payment.method}` : ''}
            {payment.paidOn ? ` le ${formatDate(payment.paidOn)}` : ''}
          </p>
        ) : (
          <p className="text-red-700 text-sm">
            Paiement à effectuer{payment.method ? ` par ${payment.method}` : ''}
          </p>
        )}
      </div>

      {/* Notes */}
      {notes && (
        <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
          <p className="font-bold text-xs mb-1">Notes :</p>
          {notes.split('\n').map((l, i) => <p key={i} className="text-xs text-gray-600">{l}</p>)}
        </div>
      )}

      {/* Signature */}
      {(signatureName || signatureTitle) && (
        <div className="flex justify-end mt-6">
          <div className="text-right">
            <p className="text-xs font-bold mb-1">Signature :</p>
            {signatureName && <p className="text-xs">{signatureName}</p>}
            {signatureTitle && <p className="text-xs text-gray-500">{signatureTitle}</p>}
          </div>
        </div>
      )}

      {/* Legal footer */}
      {issuer.legalMentions && (
        <div className="mt-8 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-400">{issuer.legalMentions}</p>
        </div>
      )}
    </div>
  );
}

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dark, setDark] = useDarkMode();
  const [logo, setLogo] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(true);
  const [peekedNumber] = useState(() => peekNextNumber());

  const [invoice, setInvoice] = useState<Invoice>(() => ({
    id: uuidv4(),
    number: peekNextNumber(),
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    issuer: DEFAULT_ISSUER,
    customer: DEFAULT_CUSTOMER,
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
    notes: '',
    signatureName: '',
    signatureTitle: '',
    totals: computeTotals([{ description: '', quantity: 1, unitPrice: 0 }], 0),
    payment: { status: 'à payer' },
    currency: 'EUR',
  }));

  useEffect(() => {
    const storedLogo = loadLogo();
    if (storedLogo) setLogo(storedLogo);
  }, []);

  useEffect(() => {
    if (id && id !== 'new') {
      const all = loadInvoices();
      const found = all.find(inv => inv.id === id);
      if (found) {
        setInvoice(found);
        setIsNew(false);
      }
    }
  }, [id]);

  const updateItems = useCallback((items: Item[]) => {
    setInvoice(prev => ({
      ...prev,
      items,
      totals: computeTotals(items, prev.totals.vatPct),
    }));
  }, []);

  const updateVat = useCallback((vatPct: number) => {
    setInvoice(prev => ({
      ...prev,
      totals: computeTotals(prev.items, vatPct),
    }));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSave = () => {
    let invoiceToSave = { ...invoice };
    if (isNew && invoice.number === peekedNumber) {
      invoiceToSave = { ...invoiceToSave, number: getNextNumber() };
      setInvoice(invoiceToSave);
      setIsNew(false);
    }
    saveInvoice(invoiceToSave);
    showToast('Facture enregistrée !');
  };

  const handleDownloadPDF = async () => {
    try {
      const pdfBytes = await generatePDF(invoice, logo);
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${invoice.number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erreur lors de la génération du PDF.');
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDuplicate = () => {
    const newNumber = getNextNumber();
    const newInvoice: Invoice = {
      ...invoice,
      id: uuidv4(),
      number: newNumber,
      date: new Date().toISOString().split('T')[0],
    };
    saveInvoice(newInvoice);
    navigate(`/edit/${newInvoice.id}`);
    showToast('Facture dupliquée !');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setLogo(base64);
      saveLogo(base64);
    };
    reader.readAsDataURL(file);
  };

  const set = <K extends keyof Invoice>(field: K, value: Invoice[K]) =>
    setInvoice(prev => ({ ...prev, [field]: value }));

  const inputClass = "w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelClass = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1";
  const sectionClass = "border border-gray-200 dark:border-gray-700 rounded p-4 mb-4";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="bg-blue-800 dark:bg-blue-900 text-white shadow-md print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate('/')}
            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded text-sm"
          >
            ← Retour
          </button>
          <span className="font-mono font-bold text-lg">Facture {invoice.number}</span>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium"
            >
              ⬇ Télécharger PDF
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
            >
              🖨 Imprimer
            </button>
            <button
              onClick={handleDuplicate}
              className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm"
            >
              ⎘ Dupliquer
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-bold"
            >
              💾 Enregistrer
            </button>
            <button
              onClick={() => setDark(d => !d)}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded text-sm"
              title="Basculer le mode sombre"
            >
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Left: Form */}
          <div className="print:hidden">
            {/* Émetteur */}
            <PartyForm label="Émetteur" value={invoice.issuer} onChange={v => set('issuer', v)} />

            {/* Client */}
            <PartyForm label="Client" value={invoice.customer} onChange={v => set('customer', v)} />

            {/* Infos facture */}
            <fieldset className={sectionClass}>
              <legend className="text-sm font-semibold text-blue-700 dark:text-blue-400 px-2">Infos facture</legend>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Numéro</label>
                  <input
                    className={inputClass}
                    value={invoice.number}
                    onChange={e => set('number', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Date *</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={invoice.date}
                    onChange={e => set('date', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Échéance</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={invoice.dueDate ?? ''}
                    onChange={e => set('dueDate', e.target.value)}
                  />
                </div>
              </div>
            </fieldset>

            {/* Logo */}
            <fieldset className={sectionClass}>
              <legend className="text-sm font-semibold text-blue-700 dark:text-blue-400 px-2">Logo</legend>
              <div className="flex items-center gap-4">
                {logo && <img src={logo} alt="Logo" className="max-h-12 max-w-24 object-contain border rounded" />}
                <div>
                  <label className={labelClass}>Importer un logo PNG</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif"
                    onChange={handleLogoUpload}
                    className="text-sm text-gray-600 dark:text-gray-400"
                  />
                </div>
              </div>
            </fieldset>

            {/* Items */}
            <fieldset className={sectionClass}>
              <legend className="text-sm font-semibold text-blue-700 dark:text-blue-400 px-2">Lignes de facture</legend>
              <ItemsTable items={invoice.items} onChange={updateItems} />
            </fieldset>

            {/* Totals */}
            <TotalsBlock totals={invoice.totals} onVatChange={updateVat} />

            {/* Payment */}
            <fieldset className={sectionClass}>
              <legend className="text-sm font-semibold text-blue-700 dark:text-blue-400 px-2">Paiement</legend>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentStatus"
                      value="à payer"
                      checked={invoice.payment.status === 'à payer'}
                      onChange={() => set('payment', { ...invoice.payment, status: 'à payer' })}
                    />
                    <span className="text-sm text-red-600 dark:text-red-400 font-medium">À payer</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentStatus"
                      value="payée"
                      checked={invoice.payment.status === 'payée'}
                      onChange={() => set('payment', { ...invoice.payment, status: 'payée' })}
                    />
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">Payée</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Mode de paiement</label>
                    <select
                      className={inputClass}
                      value={invoice.payment.method ?? ''}
                      onChange={e => set('payment', { ...invoice.payment, method: (e.target.value || undefined) as Payment['method'] })}
                    >
                      <option value="">— Choisir —</option>
                      <option value="chèque">Chèque</option>
                      <option value="virement">Virement</option>
                      <option value="CB">CB</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  {invoice.payment.status === 'payée' && (
                    <div>
                      <label className={labelClass}>Date de paiement</label>
                      <input
                        type="date"
                        className={inputClass}
                        value={invoice.payment.paidOn ?? ''}
                        onChange={e => set('payment', { ...invoice.payment, paidOn: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Notes & Signature */}
            <fieldset className={sectionClass}>
              <legend className="text-sm font-semibold text-blue-700 dark:text-blue-400 px-2">Notes & Signature</legend>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className={labelClass}>Notes</label>
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={invoice.notes ?? ''}
                    onChange={e => set('notes', e.target.value)}
                    placeholder="Conditions particulières, mentions..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Nom signature</label>
                    <input
                      className={inputClass}
                      value={invoice.signatureName ?? ''}
                      onChange={e => set('signatureName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Titre signature</label>
                    <input
                      className={inputClass}
                      value={invoice.signatureTitle ?? ''}
                      onChange={e => set('signatureTitle', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </fieldset>
          </div>

          {/* Right: Live Preview */}
          <div className="lg:sticky lg:top-4 lg:self-start print:block">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 print:hidden">
              Aperçu
            </h2>
            <div className="overflow-auto max-h-screen">
              <InvoicePreview invoice={invoice} logo={logo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
