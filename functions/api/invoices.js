const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'content-type, authorization, x-device-id',
	'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
};

const unauthorized = () =>
	new Response(JSON.stringify({ error: 'Unauthorized' }), {
		status: 401,
		headers: {
			...corsHeaders,
			'content-type': 'application/json',
		},
	});

const badRequest = (message) =>
	new Response(JSON.stringify({ error: message }), {
		status: 400,
		headers: {
			...corsHeaders,
			'content-type': 'application/json',
		},
	});

const getDeviceId = (request) => request.headers.get('x-device-id') || '';

const checkToken = (request, env) => {
	if (!env?.SYNC_TOKEN) return true;
	const auth = request.headers.get('authorization') || '';
	return auth === `Bearer ${env.SYNC_TOKEN}`;
};

export async function onRequestOptions() {
	return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context) {
	const { request, env } = context;

	if (!checkToken(request, env)) return unauthorized();

	const deviceId = getDeviceId(request);
	if (!deviceId) return badRequest('Missing x-device-id header');
	if (!env?.INVOICES_KV) return badRequest('Missing INVOICES_KV binding');

	const raw = await env.INVOICES_KV.get(`invoices:${deviceId}`);
	const invoices = raw ? JSON.parse(raw) : [];

	return new Response(JSON.stringify({ invoices }), {
		headers: {
			...corsHeaders,
			'content-type': 'application/json',
		},
	});
}

export async function onRequestPut(context) {
	const { request, env } = context;

	if (!checkToken(request, env)) return unauthorized();

	const deviceId = getDeviceId(request);
	if (!deviceId) return badRequest('Missing x-device-id header');
	if (!env?.INVOICES_KV) return badRequest('Missing INVOICES_KV binding');

	const payload = await request.json().catch(() => null);
	if (!payload || !Array.isArray(payload.invoices)) {
		return badRequest('Payload must contain an invoices array');
	}

	await env.INVOICES_KV.put(`invoices:${deviceId}`, JSON.stringify(payload.invoices));

	return new Response(JSON.stringify({ ok: true }), {
		headers: {
			...corsHeaders,
			'content-type': 'application/json',
		},
	});
}
