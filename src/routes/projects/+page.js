import { list_projects } from '$lib/api/v1/project/project_api.js';

export async function load() {
	return {
		projects: await list_projects()
	}
}