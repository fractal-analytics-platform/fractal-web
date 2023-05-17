import { getJob, stopJob } from '$lib/server/api/v1/monitoring_api';

export async function GET({ fetch, params }) {
	const { projectId, jobId } = params;

	// Get the job from the server
	try {
		const job = await getJob(fetch, projectId, jobId);
		return new Response(JSON.stringify(job), { status: 200 });
	} catch (error) {
		console.error(error);
		return new Response(JSON.stringify({ error: 'Unable to retrieve job' }), { status: 500 });
	}
}

export async function PATCH({ fetch, params, url }) {

	const { projectId, jobId } = params;

	// Check that url has an action parameter
	if (!url.searchParams.has('action')) {
		return new Response(JSON.stringify({ error: 'No action parameter provided' }), { status: 422 });
	}

	// Get the action parameter
	const action = url.searchParams.get('action');
	console.log('Action: ' + action);

	switch (action) {
		case 'stop':
			return await stopJobExecution(fetch, projectId, jobId);
		default:
			return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 422 });
	}
}

async function stopJobExecution(fetch, projectId, jobId) {
	// Stop job execution
	try {
		const job = await stopJob(fetch, projectId, jobId);
		return new Response(JSON.stringify(job), { status: 200 });
	} catch (error) {
		console.error(error);
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}
}