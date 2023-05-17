import { getJob } from '$lib/server/api/v1/monitoring_api'

export async function GET({ fetch, params }) {

  const { projectId, jobId } = params

  // Get the job from the server
  try {
    const job = await getJob(fetch, projectId, jobId)
    return new Response(JSON.stringify(job), { status: 200 })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: 'Unable to retrieve job' }), { status: 500 })
  }

}
