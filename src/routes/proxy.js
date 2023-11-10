import { FRACTAL_SERVER_HOST } from '$env/static/private';

/**
 * @param {string} path
 */
export function createGetProxy(path) {
	return async function GET({ params, url, request }) {
		try {
			return await fetch(`${FRACTAL_SERVER_HOST}/${path}/${params.path}${url.search}`, {
				method: 'GET',
				credentials: 'include',
				headers: filterHeaders(request.headers)
			});
		} catch (err) {
			console.log(err);
			throw err;
		}
	};
}

/**
 * @param {string} path
 */
export function createPostProxy(path) {
	return async function POST({ params, url, request }) {
		try {
			return await fetch(`${FRACTAL_SERVER_HOST}/${path}/${params.path}/${url.search}`, {
				method: 'POST',
				credentials: 'include',
				headers: filterHeaders(request.headers),
				body: JSON.stringify(await request.json())
			});
		} catch (err) {
			console.log(err);
			throw err;
		}
	};
}

/**
 * @param {string} path
 */
export function createPatchProxy(path) {
	return async function PATCH({ params, url, request }) {
		try {
			return await fetch(`${FRACTAL_SERVER_HOST}/${path}/${params.path}${url.search}`, {
				method: 'PATCH',
				credentials: 'include',
				headers: filterHeaders(request.headers),
				body: JSON.stringify(await request.json())
			});
		} catch (err) {
			console.log(err);
			throw err;
		}
	};
}

/**
 * @param {string} path
 */
export function createDeleteProxy(path) {
	return async function DELETE({ params, url, request }) {
		try {
			return await fetch(`${FRACTAL_SERVER_HOST}/${path}/${params.path}${url.search}`, {
				method: 'DELETE',
				credentials: 'include',
				headers: filterHeaders(request.headers)
			});
		} catch (err) {
			console.log(err);
			throw err;
		}
	};
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
