import { memo, useEffect, useRef, useState } from 'react';
import type { Invoice } from '../types/invoice';

type PdfWorkerResponse = {
  id: number;
  bytes?: Uint8Array;
  error?: string;
};

type InvoicePreviewProps = {
  invoice: Invoice;
};

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  const ensureWorker = () => {
    if (workerRef.current || typeof Worker === 'undefined') return workerRef.current;
    workerRef.current = new Worker(new URL('../workers/pdfWorker.ts', import.meta.url), { type: 'module' });
    return workerRef.current;
  };

  useEffect(() => {
    let cancelled = false;
    let currentUrl = '';
    const requestId = ++requestIdRef.current;
    const worker = ensureWorker();

    const render = async () => {
      try {
        setError('');

        const hasSvgLogo = invoice.logoDataUrl?.startsWith('data:image/svg+xml') ?? false;
        const useWorker = Boolean(worker) && !hasSvgLogo;

        const url = await (useWorker
          ? new Promise<string>((resolve, reject) => {
              const onMessage = (event: MessageEvent<PdfWorkerResponse>) => {
                const data = event.data;
                if (data.id !== requestId) return;

                worker?.removeEventListener('message', onMessage);
                if (data.error || !data.bytes) {
                  reject(new Error(data.error || "Impossible de générer l'aperçu PDF."));
                  return;
                }

                const bytes = new Uint8Array(data.bytes.byteLength);
                bytes.set(data.bytes);
                const blob = new Blob([bytes], { type: 'application/pdf' });
                resolve(URL.createObjectURL(blob));
              };

              worker?.addEventListener('message', onMessage);
              worker?.postMessage({ id: requestId, invoice });
            })
          : (async () => {
              const { buildPdfBlobUrl } = await import('../lib/pdf');
              return buildPdfBlobUrl(invoice);
            })());

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

    const timeoutId = window.setTimeout(render, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [invoice]);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

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

export const MemoInvoicePreview = memo(InvoicePreview);
