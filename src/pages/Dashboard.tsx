import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { DashboardTable } from '../components/DashboardTable';
import type { Invoice } from '../types/invoice';

type DashboardProps = {
	invoices: Invoice[];
	onCreate: () => void;
	onPrepareCreate: () => void;
	onOpen: (invoiceId: string) => void;
	onInvoicesImported: (invoices: Invoice[]) => void;
};

export function Dashboard({ invoices, onCreate, onPrepareCreate, onOpen, onInvoicesImported }: DashboardProps) {
	const [search, setSearch] = useState('');
	const [sortBy, setSortBy] = useState<'number' | 'client' | 'date' | 'status'>('date');
	const importInputRef = useRef<HTMLInputElement>(null);

	const visibleInvoices = useMemo(() => {
		const lowered = search.trim().toLowerCase();

		const filtered = lowered
			? invoices.filter((invoice) => {
					const haystack = [
						invoice.number,
						invoice.customer.name,
						invoice.date,
						invoice.payment.status,
					]
						.join(' ')
						.toLowerCase();
					return haystack.includes(lowered);
				})
			: invoices;

		return [...filtered].sort((left, right) => {
			if (sortBy === 'date') return right.date.localeCompare(left.date);
			if (sortBy === 'number') return left.number.localeCompare(right.number);
			if (sortBy === 'client') return left.customer.name.localeCompare(right.customer.name);
			return left.payment.status.localeCompare(right.payment.status);
		});
	}, [invoices, search, sortBy]);

	const handleExport = async () => {
		const { exportInvoicesAsJson } = await import('../lib/storage');
		const content = exportInvoicesAsJson();
		const blob = new Blob([content], { type: 'application/json' });
		const url = URL.createObjectURL(blob);

		const link = document.createElement('a');
		link.href = url;
		link.download = 'factures-resonance.json';
		link.click();

		URL.revokeObjectURL(url);
	};

	const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			const { importInvoicesFromJson } = await import('../lib/storage');
			const content = await file.text();
			const imported = importInvoicesFromJson(content);
			onInvoicesImported(imported);
			alert(`Import réussi : ${imported.length} facture(s).`);
		} catch {
			alert("Import impossible : vérifie le format du fichier JSON.");
		} finally {
			event.target.value = '';
		}
	};

	return (
		<section className="space-y-4">
			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					onClick={onCreate}
					onMouseEnter={onPrepareCreate}
					onFocus={onPrepareCreate}
					className="rounded-md border border-[#B9CC92] bg-[#C8D8A8] px-3 py-2 text-sm font-medium text-[#202020] hover:bg-[#B9CC92]"
				>
					+ Nouvelle facture
				</button>
				<button
					type="button"
					onClick={handleExport}
					className="rounded-md border border-[#E0E0E0] bg-white px-3 py-2 text-sm hover:bg-[#F8F8F8]"
				>
					Export JSON
				</button>
				<button
					type="button"
					onClick={() => importInputRef.current?.click()}
					className="rounded-md border border-[#E0E0E0] bg-white px-3 py-2 text-sm hover:bg-[#F8F8F8]"
				>
					Import JSON
				</button>
				<input
					ref={importInputRef}
					type="file"
					accept="application/json"
					className="hidden"
					onChange={handleImportFile}
				/>
			</div>

			<DashboardTable
				invoices={visibleInvoices}
				search={search}
				sortBy={sortBy}
				onSearchChange={setSearch}
				onSortChange={setSortBy}
				onOpen={onOpen}
			/>
		</section>
	);
}
