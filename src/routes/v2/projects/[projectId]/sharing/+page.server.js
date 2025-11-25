import { getProject, getProjectGuests } from '$lib/server/api/v2/project_api';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('project sharing page [v2]');

export async function load({ fetch, params }) {
	logger.trace('Load project page');

	const project = await getProject(fetch, params.projectId);
	const guests = await getProjectGuests(fetch, params.projectId);

	return {
		project,
		guests
	};
}
