import { removeDuplicatedItems } from '$lib/common/component_utilities';
import { getProject as getProjectV1, getWorkflow as getWorkflowV1 } from '$lib/server/api/v1/project_api';
import { getProject as getProjectV2, getWorkflow as getWorkflowV2 } from '$lib/server/api/v2/project_api';
import { getWorkflowJobs as getWorkflowJobsV1 } from '$lib/server/api/v1/workflow_api';
import { getWorkflowJobs as getWorkflowJobsV2 } from '$lib/server/api/v2/workflow_api';
import { loadForVersion } from '$lib/common/selected_api_version';

export async function load({ fetch, params, cookies }) {
	const { projectId, workflowId } = params;

	const getProject = loadForVersion(cookies, getProjectV1, getProjectV2);
	const getWorkflowJobs = loadForVersion(cookies, getWorkflowJobsV1, getWorkflowJobsV2);
	const getWorkflow = loadForVersion(cookies, getWorkflowV1, getWorkflowV2);

	/** @type {import('$lib/types').Project} */
	const project = await getProject(fetch, projectId);

	/** @type {import('$lib/types').ApplyWorkflow[]} */
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

	const inputDatasets = removeDuplicatedItems(
		/** @type {{id: number, name: string}[]} */
		(jobs.filter((j) => j.input_dataset_dump).map((j) => j.input_dataset_dump))
	);
	const outputDatasets = removeDuplicatedItems(
		/** @type {{id: number, name: string}[]} */
		(jobs.filter((j) => j.output_dataset_dump).map((j) => j.output_dataset_dump))
	);

	return {
		project: project,
		projects: [project],
		workflow,
		workflows,
		inputDatasets,
		outputDatasets,
		jobs
	};
}
