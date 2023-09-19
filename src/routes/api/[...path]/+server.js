/**
 * These endpoints act like a proxy, forwarding all /api requests to the Python backend
 */

import { FRACTAL_SERVER_HOST } from '$env/static/private';

const baseApiUrl = `${FRACTAL_SERVER_HOST}/api`;

/** @type {import('./$types').RequestHandler} */
export function GET({ params, url, request }) {
	try {
		return fetch(`${baseApiUrl}/${params.path + url.search}`, {
			method: 'GET',
			credentials: 'include',
			headers: filterHeaders(request.headers)
		});
	} catch (err) {
		console.log(err);
		throw err;
	}
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ params, url, request }) {
	try {
		return await fetch(`${baseApiUrl}/${params.path + url.search}/`, {
			method: 'POST',
			credentials: 'include',
			headers: filterHeaders(request.headers),
			body: JSON.stringify(await request.json())
		});
	} catch (err) {
		console.log(err);
		throw err;
	}
}

/** @type {import('./$types').RequestHandler} */
export async function PATCH({ params, url, request }) {
	try {
		return await fetch(`${baseApiUrl}/${params.path + url.search}/`, {
			method: 'PATCH',
			credentials: 'include',
			headers: filterHeaders(request.headers),
			body: JSON.stringify(await request.json())
		});
	} catch (err) {
		console.log(err);
		throw err;
	}
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params, url, request }) {
	try {
		return await fetch(`${baseApiUrl}/${params.path + url.search}/`, {
			method: 'DELETE',
			credentials: 'include',
			headers: filterHeaders(request.headers)
		});
	} catch (err) {
		console.log(err);
		throw err;
	}
}

/**
 * Forward only selected headers, to avoid issues like content length mismatch
 * @type {import('$lib/types').GetHeaders}
 */
function filterHeaders(originalHeaders) {
	const headers = new Headers();
	if (originalHeaders) {
		const headersToForward = ['content-type', 'cookie'];
		for (const key of headersToForward) {
			const value = originalHeaders.get(key);
			if (value) {
				headers.set(key, value);
			}
		}
	}
	return headers;
}
