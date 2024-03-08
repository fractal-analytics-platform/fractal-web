import { invalidateAll } from '$app/navigation';

const DEFAULT_VERSION = 'v1';
const API_VERSION_COOKIE_NAME = 'fractal-api-version';

export const versionsLabels = {
	v1: 'legacy',
	v2: 'current'
};

/**
 * Load the selected API version from the cookie set by the frontend.
 * This function is called from the Svelte backend.
 * @param {import("@sveltejs/kit").Cookies} cookies
 * @returns {'v1'|'v2'}
 */
export function loadSelectedApiVersion(cookies) {
	const version = cookies.get(API_VERSION_COOKIE_NAME);
	if (isValidVersion(version)) {
		return /** @type {'v1'|'v2'} */ (version);
	}
	return DEFAULT_VERSION;
}

/**
 * Save the selected API version in the cookie and reload the page.
 * This function is called from the Svelte frontend.
 * @param {string} version
 */
export async function setSelectedApiVersion(version) {
	if (!isValidVersion(version)) {
		return;
	}
	document.cookie = `${API_VERSION_COOKIE_NAME}=${version}`;
	await invalidateAll();
	window.location.reload();
}

/**
 * @param {string|undefined} version
 * @returns {boolean}
 */
function isValidVersion(version) {
	for (const v of Object.keys(versionsLabels)) {
		if (v === version) {
			return true;
		}
	}
	return false;
}
