import { downloadWorkflowJobLog } from '$lib/server/api/v1/workflow_api'

export async function GET({ fetch, params }) {
	console.log('GET logs for job', params.jobId)

	const { jobId } = params

	try {
		const logsBlob = await downloadWorkflowJobLog(fetch, jobId)
		return new Response(logsBlob, { status: 200 })
	} catch (error) {
		console.error(error)
		return new Response(JSON.stringify({ error: 'Unable to retrieve logs' }), { status: 500 })
	}

}