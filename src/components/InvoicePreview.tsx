import type { Invoice } from '../types/invoice';
import { formatCurrency, formatDate } from '../lib/formatters';

interface Props {
  invoice: Invoice;
}

export default function InvoicePreview({ invoice }: Props) {
  const lineTotal = (item: { quantity: number; unitPrice: number; discountPct?: number }) => {
    const disc = item.discountPct ?? 0;
    return Math.round(item.quantity * item.unitPrice * (1 - disc / 100) * 100) / 100;
  };

  return (
    <div
      className="bg-white text-gray-900 shadow-xl mx-auto font-sans"
      style={{ width: '210mm', minHeight: '297mm', padding: '15mm 18mm', fontSize: '11px', lineHeight: '1.5' }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-900 tracking-wide">FACTURE</h1>
        </div>
        {invoice.issuer.logoDataUrl && (
          <img src={invoice.issuer.logoDataUrl} alt="Logo" style={{ maxHeight: '60px', maxWidth: '120px' }} className="object-contain" />
        )}
      </div>
      <hr className="border-blue-900 mb-4" />

      {/* Issuer + Customer */}
      <div className="flex justify-between mb-4">
        <div className="w-5/12">
          <p className="font-bold text-sm">{invoice.issuer.name}</p>
          {invoice.issuer.tagline && <p className="text-gray-500 text-xs">{invoice.issuer.tagline}</p>}
          <p className="text-xs whitespace-pre-line">{invoice.issuer.address}</p>
          {invoice.issuer.email && <p className="text-xs">{invoice.issuer.email}</p>}
          {invoice.issuer.phone && <p className="text-xs">{invoice.issuer.phone}</p>}
        </div>
        <div className="w-5/12 text-right">
          <p className="text-gray-500 text-xs mb-1">Facturé à :</p>
          <p className="font-bold text-sm">{invoice.customer.name}</p>
          {invoice.customer.sirenOrSiret && <p className="text-xs">SIREN/SIRET : {invoice.customer.sirenOrSiret}</p>}
          <p className="text-xs whitespace-pre-line">{invoice.customer.address}</p>
        </div>
      </div>

      {/* Invoice info */}
      <div className="bg-blue-50 border border-blue-200 rounded px-4 py-2 mb-4 flex flex-wrap gap-4 text-xs">
        <span><strong>Facture n°</strong> {invoice.number}</span>
        <span><strong>Date :</strong> {formatDate(invoice.date)}</span>
        {invoice.dueDate && <span><strong>Échéance :</strong> {formatDate(invoice.dueDate)}</span>}
        <span className={invoice.payment.status === 'payée' ? 'text-green-700 font-semibold' : 'text-orange-700 font-semibold'}>
          {invoice.payment.status === 'payée' ? '✓ Payée' : '⏳ À payer'}
        </span>
      </div>

      {/* Items table */}
      <table className="w-full text-xs border-collapse mb-4">
        <thead>
          <tr className="bg-blue-900 text-white">
            <th className="text-left px-2 py-1">Désignation</th>
            <th className="text-right px-2 py-1 w-16">Qté</th>
            <th className="text-right px-2 py-1 w-28">PU (€)</th>
            <th className="text-right px-2 py-1 w-28">Total (€)</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, i) => (
            <tr key={i} className={i % 2 === 0 ? '' : 'bg-blue-50'}>
              <td className="px-2 py-1">
                {item.description}
                {(item.discountPct ?? 0) > 0 && (
                  <span className="text-gray-500 ml-2">(remise {item.discountPct}%)</span>
                )}
              </td>
              <td className="text-right px-2 py-1">{item.quantity}</td>
              <td className="text-right px-2 py-1">{formatCurrency(item.unitPrice)}</td>
              <td className="text-right px-2 py-1 font-medium">{formatCurrency(lineTotal(item))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-4">
        <div className="w-56 text-xs">
          <div className="flex justify-between border-b py-1">
            <span className="text-gray-600">Total HT</span>
            <span>{formatCurrency(invoice.totals.subtotal)}</span>
          </div>
          <div className="flex justify-between border-b py-1 text-gray-500">
            <span>TVA ({invoice.totals.vatPct}%)</span>
            <span>{formatCurrency(invoice.totals.vatAmount)}</span>
          </div>
          {invoice.totals.vatPct === 0 && (
            <p className="text-xs text-gray-400 italic">T.V.A. non applicable, art. 293 B du CGI</p>
          )}
          <div className="flex justify-between py-1 font-bold text-blue-900 border-t-2 border-blue-900 mt-1 text-sm">
            <span>Total TTC</span>
            <span>{formatCurrency(invoice.totals.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Payment */}
      {invoice.payment.status === 'payée' && (
        <p className="text-xs text-green-700 mb-2">
          Réglée par {invoice.payment.method ?? ''}{invoice.payment.paidOn ? ` le ${formatDate(invoice.payment.paidOn)}` : ''}
        </p>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div className="mb-4">
          <p className="font-semibold text-xs mb-1">Notes :</p>
          <p className="text-xs text-gray-700 whitespace-pre-line">{invoice.notes}</p>
        </div>
      )}

      {/* Legal footer */}
      <div className="mt-8 pt-2 border-t border-gray-200 text-xs text-gray-400">
        <p>Facture en euros. T.V.A. non applicable, article 293 B du CGI.</p>
        {invoice.issuer.legalMentions && <p>{invoice.issuer.legalMentions}</p>}
      </div>

      {/* Signature */}
      {(invoice.signatureName || invoice.signatureTitle) && (
        <div className="flex justify-end mt-4 text-xs">
          <div className="text-right">
            <p>Cordialement,</p>
            {invoice.signatureName && <p className="font-bold mt-1">{invoice.signatureName}</p>}
            {invoice.signatureTitle && <p className="text-gray-500">{invoice.signatureTitle}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
