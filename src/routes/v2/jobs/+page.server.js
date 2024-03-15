import {
	removeDuplicatedItems,
	sortProjectsByTimestampCreatedDesc
} from '$lib/common/component_utilities';
import { getUserJobs, listProjects } from '$lib/server/api/v2/project_api';

export async function load({ fetch }) {
	/** @type {import('$lib/types').Project[]} */
	const projects = await listProjects(fetch);
	sortProjectsByTimestampCreatedDesc(projects);

	/** @type {import('$lib/types').ApplyWorkflow[]} */
	const jobs = await getUserJobs(fetch);

	const workflows = removeDuplicatedItems(
		/** @type {{id: number, name: string}[]} */ (
			jobs.filter((j) => j.workflow_dump).map((j) => j.workflow_dump)
		)
	);
	const inputDatasets = removeDuplicatedItems(
		/** @type {{id: number, name: string}[]} */
		(jobs.filter((j) => j.input_dataset_dump).map((j) => j.input_dataset_dump))
	);
	const outputDatasets = removeDuplicatedItems(
		/** @type {{id: number, name: string}[]} */
		(jobs.filter((j) => j.output_dataset_dump).map((j) => j.output_dataset_dump))
	);

	return {
		projects,
		workflows,
		inputDatasets,
		outputDatasets,
		jobs
	};
}
