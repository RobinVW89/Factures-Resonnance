import { useEffect, useState } from 'react';
import type { Invoice } from '../types/invoice';
import { buildPdfBlobUrl } from '../lib/pdf';

type InvoicePreviewProps = {
  invoice: Invoice;
};

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    let currentUrl = '';

    const render = async () => {
      try {
        setError('');
        const url = await buildPdfBlobUrl(invoice);
        if (!cancelled) {
          currentUrl = url;
          setPreviewUrl(url);
        }
      } catch {
        if (!cancelled) {
          setError("Impossible de générer l'aperçu PDF.");
        }
      }
    };

    render();

    return () => {
      cancelled = true;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [invoice]);

  return (
    <section className="rounded-lg border border-[#E0E0E0] bg-white p-3 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#404040]">Aperçu PDF (A4)</h3>
      {error ? (
        <p className="rounded-md bg-[#F8F8F0] p-2 text-sm text-[#202020]">{error}</p>
      ) : (
        <iframe
          title="Aperçu facture"
          src={previewUrl}
          className="h-[540px] w-full rounded-md border border-[#E0E0E0]"
        />
      )}
    </section>
  );
}
