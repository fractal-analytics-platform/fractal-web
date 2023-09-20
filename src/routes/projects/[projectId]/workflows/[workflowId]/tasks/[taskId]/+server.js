import { fail } from '@sveltejs/kit';
import {
	getWorkflow,
	deleteWorkflowTask,
} from '$lib/server/api/v1/workflow_api';

export async function DELETE({ fetch, params }) {
	console.log('Delete workflow task');

	const { projectId, workflowId, taskId } = params;

	try {
		await deleteWorkflowTask(fetch, projectId, workflowId, taskId);
		// Get updated workflow with created task
		const workflow = await getWorkflow(fetch, projectId, workflowId);
		return new Response(JSON.stringify(workflow), { status: 200 });
	} catch (error) {
		console.error(error);
		return fail(500, error.reason);
	}
}
