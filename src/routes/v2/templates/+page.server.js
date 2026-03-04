import { getSortGroupByNameAllFirstComparator } from '$lib/components/admin/user_utilities';
import { listGroups } from '$lib/server/api/auth_api';
import { getTemplates } from '$lib/server/api/v2/template_api';
import { env } from '$env/dynamic/private';

export async function load({ fetch }) {
	const templatePage = await getTemplates(fetch);
	const groups = await listGroups(fetch, false);
	const defaultGroupName = env.FRACTAL_DEFAULT_GROUP_NAME ?? null;
	return {
		groups: groups.sort(getSortGroupByNameAllFirstComparator(defaultGroupName)),
		templatePage
	};
}
