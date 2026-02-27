import type { Invoice } from '../types/invoice';
import { generateInvoicePdfBytes } from '../lib/pdf';

type PdfWorkerRequest = {
	id: number;
	invoice: Invoice;
};

type PdfWorkerResponse =
	| {
			id: number;
			bytes: Uint8Array;
	  }
	| {
			id: number;
			error: string;
	  };

self.onmessage = async (event: MessageEvent<PdfWorkerRequest>) => {
	const { id, invoice } = event.data;

	try {
		const bytes = await generateInvoicePdfBytes(invoice);
		const response: PdfWorkerResponse = { id, bytes };
		self.postMessage(response);
	} catch {
		const response: PdfWorkerResponse = {
			id,
			error: "Impossible de générer l'aperçu PDF.",
		};
		self.postMessage(response);
	}
};
