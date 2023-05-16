import { fail } from '@sveltejs/kit'
import { exportWorkflow } from '$lib/server/api/v1/workflow_api'

export async function GET({ fetch, params }) {
	console.log('GET workflow export request')

	const { workflowId } = params

	try {
		const workflowExport = await exportWorkflow(fetch, workflowId)  // FIXME: needs projectID
		return new Response(JSON.stringify(workflowExport), {	status: 200 })
	} catch (error) {
		console.error(error.reason)
		return fail(500, error.reason)
	}

}