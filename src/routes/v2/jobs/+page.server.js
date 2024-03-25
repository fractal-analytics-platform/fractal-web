import {
	removeDuplicatedItems,
	sortProjectsByTimestampCreatedDesc
} from '$lib/common/component_utilities';
import { getUserJobs, listProjects } from '$lib/server/api/v2/project_api';

export async function load({ fetch }) {
	/** @type {import('$lib/types').Project[]} */
	const projects = await listProjects(fetch);
	sortProjectsByTimestampCreatedDesc(projects);

	/** @type {import('$lib/types-v2').ApplyWorkflowV2[]} */
	const jobs = await getUserJobs(fetch);

	const workflows = removeDuplicatedItems(
		/** @type {{id: number, name: string}[]} */ (
			jobs.filter((j) => j.workflow_dump).map((j) => j.workflow_dump)
		)
	);
	const datasets = removeDuplicatedItems(
		/** @type {{id: number, name: string}[]} */
		(jobs.filter((j) => j.dataset_dump).map((j) => j.dataset_dump))
	);

	return {
		projects,
		workflows,
		datasets,
		jobs
	};
}
