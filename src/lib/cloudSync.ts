import type { Invoice } from '../types/invoice';

const DEFAULT_SCOPE = 'shared';

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

const resolveSyncScope = (): string => {
	const scope = import.meta.env.VITE_SYNC_SCOPE;
	if (typeof scope === 'string' && scope.trim()) return scope.trim();
	return DEFAULT_SCOPE;
};

const buildHeaders = (): HeadersInit => {
	const token = resolveSyncToken();
	return {
		'content-type': 'application/json',
		'x-sync-scope': resolveSyncScope(),
		...(token ? { authorization: `Bearer ${token}` } : {}),
	};
};

export type CloudSyncResult<T> =
	| {
			ok: true;
			data: T;
	  }
	| {
			ok: false;
			error: string;
			status?: number;
	  };

const readErrorMessage = async (response: Response): Promise<string> => {
	try {
		const payload = (await response.json()) as { error?: string };
		if (payload?.error) return payload.error;
	} catch {
	}
	return response.statusText || 'Erreur inconnue';
};

export const loadInvoicesFromCloud = async (): Promise<CloudSyncResult<Invoice[]>> => {
	try {
		const response = await fetch(resolveSyncEndpoint(), {
			method: 'GET',
			headers: buildHeaders(),
		});

		if (!response.ok) {
			const error = await readErrorMessage(response);
			return { ok: false, error, status: response.status };
		}

		const payload = (await response.json()) as { invoices?: Invoice[] };
		return { ok: true, data: Array.isArray(payload.invoices) ? payload.invoices : [] };
	} catch {
		return { ok: false, error: 'Erreur réseau' };
	}
};

export const syncInvoicesToCloud = async (invoices: Invoice[]): Promise<CloudSyncResult<true>> => {
	try {
		const response = await fetch(resolveSyncEndpoint(), {
			method: 'PUT',
			headers: buildHeaders(),
			body: JSON.stringify({ invoices }),
		});

		if (!response.ok) {
			const error = await readErrorMessage(response);
			return { ok: false, error, status: response.status };
		}

		return { ok: true, data: true };
	} catch {
		return { ok: false, error: 'Erreur réseau' };
	}
};
