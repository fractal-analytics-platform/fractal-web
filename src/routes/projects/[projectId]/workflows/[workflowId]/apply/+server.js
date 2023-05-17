import { applyWorkflow } from '$lib/server/api/v1/workflow_api';

export async function POST({ fetch, params, request }) {
	console.log('POST apply workflow request');

	const { projectId, workflowId } = params;
	const formData = await request.formData();

	try {
		const workflowTask = await applyWorkflow(fetch, projectId, workflowId, formData);
		return new Response(JSON.stringify(workflowTask), { status: 200 });
	} catch (error) {
		console.error('Server was not able to apply workflow', error.reason);
		// Using Response instead of fail() because fail() doesn't seem to work
		return new Response(JSON.stringify(error.reason), { status: 422 });
	}
}
