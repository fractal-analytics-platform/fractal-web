import { getWorkflow, getWorkflowJobs } from '#lib/server/api/v2/workflow_api.js';
import { getProjectDatasets } from '#lib/server/api/v2/project_api.js';
import { getDefaultWorkflowDataset } from '#lib/common/workflow_utilities.js';
import { getLogger } from '#lib/server/logger.js';
import { FRACTAL_DISPLAY_CORE_TASK_FILTER } from '$app/env/private';

const logger = getLogger('workflow page [v2]');

export async function load({ fetch, params }) {
	logger.trace('Load workflow page');

	const showOnlyCoreFiltering = FRACTAL_DISPLAY_CORE_TASK_FILTER !== 'false';

	const { projectId, workflowId } = params;

	const workflow = await getWorkflow(fetch, projectId, workflowId);
	const datasets = await getProjectDatasets(fetch, projectId);
	const jobs = await getWorkflowJobs(fetch, projectId, workflowId);

	const defaultDatasetId = getDefaultWorkflowDataset(datasets, jobs);

	return {
		workflow,
		datasets,
		defaultDatasetId,
		showOnlyCoreFiltering,
		helpLink: '/reference/workflow/'
	};
}
