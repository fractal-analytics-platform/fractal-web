import { getCurrentUser } from '$lib/server/api/auth_api';
import { getTemplates } from '$lib/server/api/v2/template_api';

export async function load({ fetch }) {
	const templatePage = await getTemplates(fetch);
	
	const user =
		/** @type {import('fractal-components/types/api').User & {group_ids_names: Array<[number, string]>}} */ (
			await getCurrentUser(fetch, true)
		);
		
	return {
		user,
		templatePage
	};
}
