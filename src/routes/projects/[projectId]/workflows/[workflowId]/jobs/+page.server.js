import { getProject, getWorkflow, getJobs } from '$lib/server/api/v1/project_api';

export async function load({ fetch, params }) {
	const { projectId, workflowId } = params;

	const project = await getProject(fetch, projectId);
	const workflow = await getWorkflow(fetch, projectId, workflowId);
	const jobs = await getJobs(fetch, projectId);

	return {
		project: project,
		projects: [project],
		workflow: workflow,
		workflows: [workflow],
		datasets: project.dataset_list,
		jobs
	};
}
