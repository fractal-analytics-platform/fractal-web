import { sortProjectsByTimestampCreatedDesc } from '$lib/common/component_utilities';
import { loadForVersion } from '$lib/common/selected_api_version';
import { listProjects as listProjectsV1 } from '$lib/server/api/v1/project_api';
import { listProjects as listProjectsV2 } from '$lib/server/api/v2/project_api';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, cookies }) {
	console.log('Load projects page');

	const listProjects = loadForVersion(cookies, listProjectsV1, listProjectsV2);

	// Load projects from server
	/** @type {import('$lib/types').Project[]} */
	const projects = await listProjects(fetch);
	sortProjectsByTimestampCreatedDesc(projects);

	return {
		projects
	};
}
