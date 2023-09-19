import { redirect, fail } from '@sveltejs/kit'
import { listProjects, createProject } from '$lib/server/api/v1/project_api';

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

export const actions = {
	default: async ({ fetch, request }) => {
		// Set fetch function to use in api calls

		// Create project
		const data = await request.formData();
		let project
		try {
			project = await createProject(fetch, data);
		} catch (/** @type {any} */ error) {
			return fail(422, { error: error.reason })
		}
		throw redirect(302, `/projects/${project.id}`)
	}
};
