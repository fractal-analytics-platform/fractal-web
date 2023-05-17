import { fail } from '@sveltejs/kit'
import { exportWorkflow } from '$lib/server/api/v1/workflow_api'

export async function GET({ fetch, params }) {
	console.log('GET workflow export request')

	const { projectId, workflowId } = params

	try {
		const workflowExport = await exportWorkflow(fetch, projectId, workflowId)
		return new Response(JSON.stringify(workflowExport), {	status: 200 })
	} catch (error) {
		console.error(error.reason)
		return fail(500, error.reason)
	}

}