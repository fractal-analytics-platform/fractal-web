import { sortProjectsByTimestampCreatedDesc } from '$lib/common/component_utilities';
import { listProjects } from '$lib/server/api/v1/project_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('projects page [v1]');

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	logger.trace('Loading projects page');

	// Load projects from server
	/** @type {import('$lib/types').Project[]} */
	const projects = await listProjects(fetch);
	sortProjectsByTimestampCreatedDesc(projects);

	return {
		projects
	};
}
