import { lazy, Suspense, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { computeTotals } from '../lib/calculations';
import { ItemsTable } from '../components/ItemsTable';
import { TotalsCard } from '../components/TotalsCard';
import type { Invoice, PaymentMethod } from '../types/invoice';

const InvoicePreview = lazy(() =>
	import('../components/InvoicePreview').then((module) => ({ default: module.InvoicePreview })),
);

type EditorProps = {
	invoice: Invoice;
	onChange: (invoice: Invoice) => void;
	onSave: (invoice: Invoice) => void;
	onBack: () => void;
};

export function Editor({ invoice, onChange, onSave, onBack }: EditorProps) {
	const previewAnchorRef = useRef<HTMLDivElement | null>(null);
	const [shouldLoadPreview, setShouldLoadPreview] = useState(false);

	useEffect(() => {
		if (shouldLoadPreview) return;
		const anchor = previewAnchorRef.current;
		if (!anchor) return;

		if (typeof IntersectionObserver === 'undefined') {
			setShouldLoadPreview(true);
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (entry?.isIntersecting) {
					setShouldLoadPreview(true);
					observer.disconnect();
				}
			},
			{ rootMargin: '200px 0px' },
		);

		observer.observe(anchor);
		return () => observer.disconnect();
	}, [shouldLoadPreview]);

	const updateInvoice = (patch: Partial<Invoice>) => {
		onChange({ ...invoice, ...patch });
	};

	const updateVat = (vatPct: number) => {
		updateInvoice({ totals: computeTotals(invoice.items, vatPct) });
	};

	const updateItems = (items: Invoice['items']) => {
		updateInvoice({
			items,
			totals: computeTotals(items, invoice.totals.vatPct),
		});
	};

	const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => {
			const dataUrl = typeof reader.result === 'string' ? reader.result : '';
			updateInvoice({ logoDataUrl: dataUrl });
		};
		reader.readAsDataURL(file);
	};

	return (
		<section className="space-y-4">
			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					onClick={onBack}
					className="rounded-md border border-[#E0E0E0] bg-white px-3 py-2 text-sm hover:bg-[#F8F8F8]"
				>
					← Retour
				</button>
				<button
					type="button"
					onClick={() => onSave(invoice)}
					className="rounded-md border border-[#B9CC92] bg-[#C8D8A8] px-3 py-2 text-sm font-medium text-[#202020] hover:bg-[#B9CC92]"
				>
					Enregistrer
				</button>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<div className="space-y-4">
					<section className="rounded-lg border border-[#E0E0E0] bg-white p-4 shadow-sm">
						<h2 className="mb-3 text-base font-semibold">Facture</h2>
						<div className="grid gap-2 sm:grid-cols-2">
							<label className="text-sm">
								Numéro
								<input
									value={invoice.number}
									onChange={(event) => updateInvoice({ number: event.target.value })}
									className="mt-1 w-full rounded-md border border-[#E0E0E0] bg-white px-2 py-1"
								/>
							</label>
							<label className="text-sm">
								Date
								<input
									type="date"
									value={invoice.date}
									onChange={(event) => updateInvoice({ date: event.target.value })}
									className="mt-1 w-full rounded-md border border-[#E0E0E0] bg-white px-2 py-1"
								/>
							</label>
							<label className="text-sm">
								Échéance
								<input
									type="date"
									value={invoice.dueDate || ''}
									onChange={(event) => updateInvoice({ dueDate: event.target.value })}
									className="mt-1 w-full rounded-md border border-[#E0E0E0] bg-white px-2 py-1"
								/>
							</label>
							<label className="text-sm">
								TVA (%)
								<input
									type="number"
									min={0}
									step={1}
									value={Math.round(invoice.totals.vatPct * 100)}
									onChange={(event) => updateVat(Number(event.target.value) / 100)}
									className="mt-1 w-full rounded-md border border-[#E0E0E0] bg-white px-2 py-1"
								/>
							</label>
						</div>
					</section>

					<section className="rounded-lg border border-[#E0E0E0] bg-white p-4 shadow-sm">
						<h2 className="mb-3 text-base font-semibold">Émetteur</h2>
						<div className="grid gap-2">
							<input
								placeholder="Nom"
								value={invoice.issuer.name}
								onChange={(event) => updateInvoice({ issuer: { ...invoice.issuer, name: event.target.value } })}
								className="rounded-md border border-[#E0E0E0] bg-white px-2 py-1"
							/>
							<input
								placeholder="Adresse"
								value={invoice.issuer.address}
								onChange={(event) => updateInvoice({ issuer: { ...invoice.issuer, address: event.target.value } })}
								className="rounded-md border border-[#E0E0E0] bg-white px-2 py-1"
							/>
							<input
								placeholder="Email"
								value={invoice.issuer.email || ''}
								onChange={(event) => updateInvoice({ issuer: { ...invoice.issuer, email: event.target.value } })}
								className="rounded-md border border-[#E0E0E0] bg-white px-2 py-1"
							/>
							<input
								placeholder="Téléphone"
								value={invoice.issuer.phone || ''}
								onChange={(event) => updateInvoice({ issuer: { ...invoice.issuer, phone: event.target.value } })}
								className="rounded-md border border-[#E0E0E0] bg-white px-2 py-1"
							/>
							<textarea
								placeholder="Mentions légales"
								value={invoice.issuer.legalMentions || ''}
								onChange={(event) =>
									updateInvoice({ issuer: { ...invoice.issuer, legalMentions: event.target.value } })
								}
								className="rounded-md border border-slate-300 px-2 py-1"
								rows={3}
							/>
							<label className="text-sm">
								Logo
								<input type="file" accept="image/*" onChange={handleLogoUpload} className="mt-1 block w-full" />
							</label>
						</div>
					</section>

					<section className="rounded-lg border border-[#E0E0E0] bg-white p-4 shadow-sm">
						<h2 className="mb-3 text-base font-semibold">Client</h2>
						<div className="grid gap-2">
							<input
								placeholder="Nom client"
								value={invoice.customer.name}
								onChange={(event) => updateInvoice({ customer: { ...invoice.customer, name: event.target.value } })}
								className="rounded-md border border-[#E0E0E0] bg-white px-2 py-1"
							/>
							<input
								placeholder="Adresse client"
								value={invoice.customer.address}
								onChange={(event) => updateInvoice({ customer: { ...invoice.customer, address: event.target.value } })}
								className="rounded-md border border-[#E0E0E0] bg-white px-2 py-1"
							/>
							<input
								placeholder="SIREN / SIRET"
								value={invoice.customer.sirenOrSiret || ''}
								onChange={(event) =>
									updateInvoice({ customer: { ...invoice.customer, sirenOrSiret: event.target.value } })
								}
								className="rounded-md border border-[#E0E0E0] bg-white px-2 py-1"
							/>
						</div>
					</section>

					<ItemsTable items={invoice.items} onChange={updateItems} />

					<section className="rounded-lg border border-[#E0E0E0] bg-white p-4 shadow-sm">
						<h2 className="mb-3 text-base font-semibold">Paiement et signature</h2>
						<div className="grid gap-2 sm:grid-cols-2">
							<label className="text-sm">
								Statut
								<select
									value={invoice.payment.status}
									onChange={(event) =>
										updateInvoice({
											payment: {
												...invoice.payment,
												status: event.target.value as 'payée' | 'à payer',
											},
										})
									}
									className="mt-1 w-full rounded-md border border-[#E0E0E0] bg-white px-2 py-1"
								>
									<option value="à payer">À payer</option>
									<option value="payée">Payée</option>
								</select>
							</label>
							<label className="text-sm">
								Méthode
								<select
									value={invoice.payment.method || ''}
									onChange={(event) =>
										updateInvoice({
											payment: {
												...invoice.payment,
												method: (event.target.value || undefined) as PaymentMethod | undefined,
											},
										})
									}
									className="mt-1 w-full rounded-md border border-[#E0E0E0] bg-white px-2 py-1"
								>
									<option value="">-</option>
									<option value="virement">Virement</option>
									<option value="chèque">Chèque</option>
									<option value="CB">CB</option>
									<option value="autre">Autre</option>
								</select>
							</label>
							<label className="text-sm">
								Date de règlement
								<input
									type="date"
									value={invoice.payment.paidOn || ''}
									onChange={(event) =>
										updateInvoice({
											payment: {
												...invoice.payment,
												paidOn: event.target.value,
											},
										})
									}
									className="mt-1 w-full rounded-md border border-[#E0E0E0] bg-white px-2 py-1"
								/>
							</label>
							<label className="text-sm">
								Signataire
								<input
									value={invoice.signatureName || ''}
									onChange={(event) => updateInvoice({ signatureName: event.target.value })}
									className="mt-1 w-full rounded-md border border-[#E0E0E0] bg-white px-2 py-1"
								/>
							</label>
						</div>
						<textarea
							placeholder="Notes"
							value={invoice.notes || ''}
							onChange={(event) => updateInvoice({ notes: event.target.value })}
							className="mt-2 w-full rounded-md border border-[#E0E0E0] bg-white px-2 py-1"
							rows={3}
						/>
					</section>
				</div>

				<div className="space-y-4">
					<TotalsCard totals={invoice.totals} />
					<div ref={previewAnchorRef}>
						{shouldLoadPreview ? (
							<Suspense
								fallback={
									<section className="rounded-lg border border-[#E0E0E0] bg-white p-3 shadow-sm">
										<h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#404040]">Aperçu PDF (A4)</h3>
										<div className="h-[540px] w-full animate-pulse rounded-md border border-[#E0E0E0] bg-[#F0F0F0]" />
									</section>
								}
							>
								<InvoicePreview invoice={invoice} />
							</Suspense>
						) : (
							<section className="rounded-lg border border-[#E0E0E0] bg-white p-3 shadow-sm">
								<h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#404040]">Aperçu PDF (A4)</h3>
								<p className="text-sm text-[#606060]">L’aperçu se chargera automatiquement quand cette zone sera visible.</p>
							</section>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}
