import { useState } from 'react';
import type { Invoice } from '../types/invoice';
import { generateInvoicePDF } from '../lib/pdf';

interface Props {
  invoice: Invoice;
  label?: string;
  className?: string;
}

export default function PdfDownloader({ invoice, label = 'Télécharger PDF', className = '' }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const bytes = await generateInvoicePDF(invoice);
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${invoice.number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className={`px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 disabled:opacity-50 transition-colors ${className}`}
    >
      {loading ? 'Génération...' : label}
    </button>
  );
}
