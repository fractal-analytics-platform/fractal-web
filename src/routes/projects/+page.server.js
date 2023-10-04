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
	const projects = await loadProjects(fetch);

	return {
		projects
	};
}
