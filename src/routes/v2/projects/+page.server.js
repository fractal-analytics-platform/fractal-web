import { sortProjectsByTimestampCreatedDesc } from '$lib/common/component_utilities';
import { listProjects } from '$lib/server/api/v2/project_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('projects page [v2]');

export async function load({ fetch }) {
	logger.trace('Loading projects page');

	const projects = await listProjects(fetch);
	sortProjectsByTimestampCreatedDesc(projects);

	return {
		projects
	};
}
