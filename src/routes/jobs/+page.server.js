import { listProjects, getWorkflows, getJobs } from '$lib/server/api/v1/project_api';

export async function load({ fetch }) {
	const projects = await listProjects(fetch);

	let workflows = [];
	let jobs = [];
	for (const project of projects) {
		workflows = workflows.concat(await getWorkflows(fetch, project.id));
		jobs = jobs.concat(await getJobs(fetch, project.id));
	}

	return {
		projects: projects,
		workflows: workflows,
		jobs
	};
}
