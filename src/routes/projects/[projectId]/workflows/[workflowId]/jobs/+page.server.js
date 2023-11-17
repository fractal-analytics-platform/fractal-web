import { getProject, getWorkflow } from '$lib/server/api/v1/project_api';
import { getWorkflowJobs } from '$lib/server/api/v1/workflow_api';

export async function load({ fetch, params }) {
	const { projectId, workflowId } = params;

	/** @type {import('$lib/types').Project} */
	const project = await getProject(fetch, projectId);

	/** @type {import('$lib/types').ApplyWorkflow[]} */
	const jobs = await getWorkflowJobs(fetch, projectId, workflowId);

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
		project: project,
		projects: [project],
		workflow: workflows[0],
		workflows: workflows,
		datasets: project.dataset_list,
		jobs
	};
}
