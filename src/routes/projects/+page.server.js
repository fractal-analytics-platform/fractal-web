import { getUserDatasets } from '$lib/server/api/v1/dataset_api';
import { listProjects } from '$lib/server/api/v1/project_api';

async function loadProjects(fetch) {
	return await listProjects(fetch).catch((error) => {
		console.error(error);
		return [];
	});
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	console.log('Load projects page');

	// Load projects from server
	/** @type {import('$lib/types').Project[]} */
	const projects = await loadProjects(fetch);
	/** @type {import('$lib/types').Dataset[]} */
	const datasets = await getUserDatasets(fetch);

	return {
		projects,
		datasets
	};
}
