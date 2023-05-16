import { getJob } from '$lib/server/api/v1/monitoring_api'

export async function GET({ fetch, params }) { // FIXME: needs projectID

  // Get the job from the server
  try {
    const job = await getJob(fetch, params.id) //FIXME: needs projectId
    return new Response(JSON.stringify(job), { status: 200 })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: 'Unable to retrieve job' }), { status: 500 })
  }

}