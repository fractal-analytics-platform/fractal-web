import { getUserDatasets } from '$lib/server/api/v1/dataset_api.js';
import { getUserJobs, listProjects } from '$lib/server/api/v1/project_api';
import { getUserWorkflows } from '$lib/server/api/v1/workflow_api';

export async function load({ fetch }) {
	/** @type {import('$lib/types').Project[]} */
	const projects = await listProjects(fetch);

	/** @type {import('$lib/types').ApplyWorkflow[]} */
	const jobs = await getUserJobs(fetch);

	/** @type {import('$lib/types').Workflow[]} */
	const workflows = await getUserWorkflows(fetch);

	/** @type {import('$lib/types').Dataset[]} */
	const datasets = await getUserDatasets(fetch);

	return {
		projects,
		workflows,
		datasets,
		jobs
	};
}
