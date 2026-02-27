import type { Invoice } from '../types/invoice';

const DEVICE_ID_KEY = 'fr.device.id';

const resolveSyncEndpoint = (): string => {
	const endpoint = import.meta.env.VITE_SYNC_ENDPOINT;
	if (typeof endpoint === 'string' && endpoint.trim()) return endpoint.trim();
	return '/api/invoices';
};

const resolveSyncToken = (): string | undefined => {
	const token = import.meta.env.VITE_SYNC_TOKEN;
	if (typeof token !== 'string') return undefined;
	const value = token.trim();
	return value || undefined;
};

const ensureDeviceId = (): string => {
	const existing = localStorage.getItem(DEVICE_ID_KEY);
	if (existing) return existing;

	const generated = crypto.randomUUID();
	localStorage.setItem(DEVICE_ID_KEY, generated);
	return generated;
};

const buildHeaders = (): HeadersInit => {
	const token = resolveSyncToken();
	return {
		'content-type': 'application/json',
		'x-device-id': ensureDeviceId(),
		...(token ? { authorization: `Bearer ${token}` } : {}),
	};
};

export const loadInvoicesFromCloud = async (): Promise<Invoice[] | null> => {
	try {
		const response = await fetch(resolveSyncEndpoint(), {
			method: 'GET',
			headers: buildHeaders(),
		});

		if (!response.ok) return null;

		const payload = (await response.json()) as { invoices?: Invoice[] };
		return Array.isArray(payload.invoices) ? payload.invoices : [];
	} catch {
		return null;
	}
};

export const syncInvoicesToCloud = async (invoices: Invoice[]): Promise<boolean> => {
	try {
		const response = await fetch(resolveSyncEndpoint(), {
			method: 'PUT',
			headers: buildHeaders(),
			body: JSON.stringify({ invoices }),
		});

		return response.ok;
	} catch {
		return false;
	}
};
