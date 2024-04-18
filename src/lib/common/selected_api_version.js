import { goto } from "$app/navigation";

/**
 * Save the selected API version in the cookie and reload the page.
 * This function is called from the Svelte frontend.
 * @param {string} path
 * @param {string} version
 */
export async function reloadVersionedPage(path, version) {
	if ((version === 'v2' && path.startsWith('/v1')) || (version === 'v1' && path.startsWith('/v2'))) {
		const newPath = path.replace(/^(\/v(1|2)\/)(.*)/, `/${version}/$3`);
		await goto(newPath);
	}
}
