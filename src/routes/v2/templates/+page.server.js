import { getCurrentUser } from '$lib/server/api/auth_api';

export async function load({ fetch }) {
	const user =
		/** @type {import('fractal-components/types/api').User & {group_ids_names: Array<[number, string]>}} */ (
			await getCurrentUser(fetch, true)
		);
	return { user };
}
