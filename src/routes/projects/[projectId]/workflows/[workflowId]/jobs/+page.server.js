import { getProject, getProjectDatasets } from '$lib/server/api/v1/project_api';
import { getUserWorkflows, getWorkflowJobs } from '$lib/server/api/v1/workflow_api';

export async function load({ fetch, params }) {
	const { projectId, workflowId } = params;

	/** @type {import('$lib/types').Project} */
	const project = await getProject(fetch, projectId);

	/** @type {import('$lib/types').ApplyWorkflow[]} */
	const jobs = await getWorkflowJobs(fetch, projectId, workflowId);

	/** @type {import('$lib/types').Workflow[]} */
	const workflows = await getUserWorkflows(fetch);

	/** @type {import('$lib/types').Workflow[]} */
	const datasets = await getProjectDatasets(fetch, projectId);

	return {
		project: project,
		projects: [project],
		workflow: workflows[0],
		workflows,
		datasets,
		jobs
	};
}
