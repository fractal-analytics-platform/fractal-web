import { deleteProject } from '$lib/server/api/v1/project_api';

export async function DELETE({ fetch, url }) {
	console.log('Delete project request');

	const project = url.searchParams.get('project');

	return await deleteProject(fetch, project);
}
