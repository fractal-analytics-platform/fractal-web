import { getUserJobs, getWorkflow, listProjects } from '$lib/server/api/v1/project_api';

export async function load({ fetch }) {
	/** @type {import('$lib/types').Project[]} */
	const projects = await listProjects(fetch);

	/** @type {import('$lib/types').ApplyWorkflow[]} */
	const jobs = await getUserJobs(fetch);

	let workflows = [];
	const workflowsPromises = [];

	for (const job of jobs) {
		if (job.workflow_dump === null) {
			workflowsPromises.push(getWorkflow(fetch, job.project_id, job.workflow_id));
		} else {
			workflows.push(job.workflow_dump);
		}
	}

	if (workflowsPromises.length > 0) {
		workflows = workflows.concat(await Promise.all(workflowsPromises));
	}

	return {
		projects: projects,
		workflows: workflows,
		jobs
	};
}
