import { removeDuplicatedItems } from '$lib/common/component_utilities';
import { getProject, getWorkflow } from '$lib/server/api/v2/project_api';
import { getWorkflowJobs } from '$lib/server/api/v2/workflow_api';

export async function load({ fetch, params }) {
	const { projectId, workflowId } = params;

	/** @type {import('$lib/types-v2').ProjectV2} */
	const project = await getProject(fetch, projectId);

	/** @type {import('$lib/types-v2').ApplyWorkflowV2[]} */
	const jobs = await getWorkflowJobs(fetch, projectId, workflowId);

	const workflows = removeDuplicatedItems(
		/** @type {{id: number, name: string}[]} */ (
			jobs.filter((j) => j.workflow_dump).map((j) => j.workflow_dump)
		)
	);
	let workflow;
	if (workflows.length > 0) {
		workflow = workflows[0];
	} else {
		workflow = await getWorkflow(fetch, projectId, workflowId);
	}

	const datasets = removeDuplicatedItems(
		/** @type {{id: number, name: string}[]} */
		(jobs.filter((j) => j.dataset_dump).map((j) => j.dataset_dump))
	);

	return {
		project: project,
		projects: [project],
		workflow,
		workflows,
		datasets,
		jobs
	};
}
