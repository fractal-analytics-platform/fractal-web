import { getWorkflow, getWorkflowJobs } from '$lib/server/api/v2/workflow_api';
import { getProjectDatasets } from '$lib/server/api/v2/project_api';
import { getDefaultWorkflowDataset } from '$lib/common/workflow_utilities';

export async function load({ fetch, params }) {
	console.log('Load workflow page');

	const { projectId, workflowId } = params;

	const workflow = await getWorkflow(fetch, projectId, workflowId);
	const datasets = await getProjectDatasets(fetch, projectId);
	const jobs = await getWorkflowJobs(fetch, projectId, workflowId);

	const defaultDatasetId = getDefaultWorkflowDataset(datasets, jobs);

	return {
		workflow,
		datasets,
		defaultDatasetId
	};
}
