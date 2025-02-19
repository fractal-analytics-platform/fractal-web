import { getWorkflow, getWorkflowJobs } from '$lib/server/api/v2/workflow_api';
import { getProjectDatasets } from '$lib/server/api/v2/project_api';
import { getDefaultWorkflowDataset } from '$lib/common/workflow_utilities';
import { getLogger } from '$lib/server/logger.js';
import { getCurrentUser } from '$lib/server/api/auth_api';
import { env } from '$env/dynamic/private';

const logger = getLogger('workflow page [v2]');

export async function load({ fetch, params }) {
	logger.trace('Load workflow page');

	const { projectId, workflowId } = params;

	const user =
		/** @type {import('fractal-components/types/api').User & {group_ids_names: Array<[number, string]>}} */ (
			await getCurrentUser(fetch, true)
		);
	const workflow = await getWorkflow(fetch, projectId, workflowId);
	const datasets = await getProjectDatasets(fetch, projectId);
	const jobs = await getWorkflowJobs(fetch, projectId, workflowId);

	const defaultDatasetId = getDefaultWorkflowDataset(datasets, jobs);

	const attributeFiltersEnabled = env.ENABLE_INTERACTIVE_ATTRIBUTE_FILTERS === 'true';

	return {
		workflow,
		datasets,
		defaultDatasetId,
		user,
		attributeFiltersEnabled
	};
}
