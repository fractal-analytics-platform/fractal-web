import { fail } from '@sveltejs/kit';
import { getWorkflow, updateWorkflow, createWorkflowTask } from '$lib/server/api/v1/workflow_api';
import { getProject } from '$lib/server/api/v1/project_api';

export async function load({ fetch, params }) {
	console.log('Load workflow page');

	const { projectId, workflowId } = params;

	// Get the project
	const project = await getProject(fetch, projectId).catch((error) => {
		console.error('Error getting project', error);
		return null;
	});

	// Get the workflow
	const workflow = await getWorkflow(fetch, projectId, workflowId).catch((error) => {
		console.error('Error getting workflow', error);
		return null;
	});

	// Get available datasets
	const datasets = project ? project.dataset_list : [];

	return {
		project,
		workflow,
		datasets
	};
}

export const actions = {
	updateWorkflow: async ({ fetch, request, params }) => {
		console.log('Update workflow');

		const { projectId, workflowId } = params;
		const formData = await request.formData();

		try {
			const updatedWorkflow = await updateWorkflow(fetch, projectId, workflowId, formData);
			return updatedWorkflow;
		} catch (error) {
			console.error(error.reason);
			return fail(500, error.reason);
		}
	},

	createWorkflowTask: async ({ fetch, request, params }) => {
		console.log('Create workflow task');

		const { projectId, workflowId } = params;
		const formData = await request.formData();

		try {
			await createWorkflowTask(fetch, projectId, workflowId, formData);
			// Get updated workflow with created task
			return await getWorkflow(fetch, projectId, workflowId);
		} catch (error) {
			console.error(error.reason);
			return fail(500, error.reason);
		}
	}
};
