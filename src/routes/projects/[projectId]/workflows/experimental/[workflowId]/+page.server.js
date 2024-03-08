import { getWorkflow as getWorkflowV1 } from '$lib/server/api/v1/workflow_api';
import { getWorkflow as getWorkflowV2 } from '$lib/server/api/v2/workflow_api';
import { getProjectDatasets as getProjectDatasetsV1 } from '$lib/server/api/v1/project_api';
import { getProjectDatasets as getProjectDatasetsV2 } from '$lib/server/api/v2/project_api';
import { loadForVersion } from '$lib/common/selected_api_version';

export async function load({ fetch, params, cookies }) {
	console.log('Load workflow page');

	const { projectId, workflowId } = params;

	const getWorkflow = loadForVersion(cookies, getWorkflowV1, getWorkflowV2);
	const getProjectDatasets = loadForVersion(cookies, getProjectDatasetsV1, getProjectDatasetsV2);

	// Get the workflow
	const workflow = await getWorkflow(fetch, projectId, workflowId);

	// Get the datasets
	const datasets = await getProjectDatasets(fetch, projectId);

	return {
		workflow,
		datasets
	};
}
