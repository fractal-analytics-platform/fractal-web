import { downloadWorkflowJobLog } from '$lib/server/api/v1/workflow_api'

export async function GET({ fetch, params }) {

	const { projectId, jobId } = params

	console.log('GET logs for job', jobId)

	try {
		const logsBlob = await downloadWorkflowJobLog(fetch, projectId, jobId)
		return new Response(logsBlob, { status: 200 })
	} catch (error) {
		console.error(error)
		return new Response(JSON.stringify({ error: 'Unable to retrieve logs' }), { status: 500 })
	}

}