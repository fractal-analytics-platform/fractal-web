import { getTemplates } from '$lib/server/api/v2/template_api';

export async function load({ fetch }) {
	const templatePage = await getTemplates(fetch, 1, 3);
	return {
		templatePage
	};
}
