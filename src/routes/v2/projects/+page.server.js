import { sortProjectsByTimestampCreatedDesc } from '$lib/common/component_utilities';
import { listProjects } from '$lib/server/api/v2/project_api';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	console.log('Load projects page');

	// Load projects from server
	/** @type {import('$lib/types').Project[]} */
	const projects = await listProjects(fetch);
	sortProjectsByTimestampCreatedDesc(projects);

	return {
		projects
	};
}
