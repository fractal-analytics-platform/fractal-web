import { env } from '$env/dynamic/private';
import { getLogger } from '$lib/server/logger.js';
import { error } from '@sveltejs/kit';

const logger = getLogger('proxy');

/**
 * @param {string} path
 * @param {string[]} forbiddenPaths
 */
export function createGetProxy(path, forbiddenPaths = []) {
	return async function GET({ params, url, request }) {
		checkForbiddenPaths(params.path, forbiddenPaths);
		try {
			logger.info('[GET] - /%s/%s/%s', path, params.path, url.search);
			return await fetch(`${env.FRACTAL_SERVER_HOST}/${path}/${params.path}/${url.search}`, {
				method: 'GET',
				credentials: 'include',
				headers: filterHeaders(request.headers)
			});
		} catch (err) {
			handleError(err);
		}
	};
}

/**
 * @param {string} path
 * @param {string[]} forbiddenPaths
 */
export function createPostProxy(path, forbiddenPaths = []) {
	return async function POST({ params, url, request }) {
		checkForbiddenPaths(params.path, forbiddenPaths);
		try {
			logger.info('[POST] - /%s/%s/%s', path, params.path, url.search);
			return await fetch(`${env.FRACTAL_SERVER_HOST}/${path}/${params.path}/${url.search}`, {
				method: 'POST',
				credentials: 'include',
				headers: filterHeaders(request.headers),
				body: request.body,
				// To avoid error "RequestInit: duplex option is required when sending a body"
				// @ts-ignore, not standard, but supported by undici; enable re-streaming of request
				duplex: 'half'
			});
		} catch (err) {
			handleError(err);
		}
	};
}

/**
 * @param {string} path
 * @param {string[]} forbiddenPaths
 */
export function createPatchProxy(path, forbiddenPaths = []) {
	return async function PATCH({ params, url, request }) {
		checkForbiddenPaths(params.path, forbiddenPaths);
		try {
			logger.info('[PATCH] - /%s/%s/%s', path, params.path, url.search);
			return await fetch(`${env.FRACTAL_SERVER_HOST}/${path}/${params.path}/${url.search}`, {
				method: 'PATCH',
				credentials: 'include',
				headers: filterHeaders(request.headers),
				body: request.body,
				// @ts-ignore, not standard, but supported by undici; enable re-streaming of request
				duplex: 'half'
			});
		} catch (err) {
			handleError(err);
		}
	};
}

/**
 * @param {string} path
 * @param {string[]} forbiddenPaths
 */
export function createDeleteProxy(path, forbiddenPaths = []) {
	return async function DELETE({ params, url, request }) {
		checkForbiddenPaths(params.path, forbiddenPaths);
		try {
			logger.info('[DELETE] - /%s/%s/%s', path, params.path, url.search);
			return await fetch(`${env.FRACTAL_SERVER_HOST}/${path}/${params.path}/${url.search}`, {
				method: 'DELETE',
				credentials: 'include',
				headers: filterHeaders(request.headers)
			});
		} catch (err) {
			handleError(err);
		}
	};
}

/**
 * @param {string} path
 * @param {string[]} forbiddenPaths
 */
function checkForbiddenPaths(path, forbiddenPaths) {
	for (const forbiddenPath of forbiddenPaths) {
		if (path.startsWith(forbiddenPath)) {
			error(403);
		}
	}
}

/**
 * @param {unknown} err
 */
function handleError(err) {
	if (err instanceof Error && err.cause instanceof Error) {
		// Underlying cause might be a Svelte Kit error
		error(500, err.cause.message);
	} else if (err instanceof Error) {
		error(500, err.message);
	} else {
		logger.debug(err);
		throw err;
	}
}

/**
 * Forward only selected headers, to avoid issues like content length mismatch
 * @type {import('fractal-components/types/api').GetHeaders}
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
