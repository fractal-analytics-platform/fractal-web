import { list_tasks } from '$lib/api/v1/task/task_api'

export async function GET({ fetch, cookies }) {
  let responseStatus = 200

  let responseData = null

  try {
    responseData = await list_tasks(fetch, cookies)
  } catch(e) {
    responseStatus = 500
  }

  const responseOpt = {
    status: responseStatus
  }
  return new Response(JSON.stringify(responseData), responseOpt)
}