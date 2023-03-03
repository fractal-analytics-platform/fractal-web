import { task_collection_status } from '$lib/api/v1/task/task_api'

export async function GET({ fetch, cookies, params }) {
  // Suppose that the function executes successfully
  let responseStatus = 200
  let responseData = {}

  try {
    responseData = await task_collection_status(fetch, cookies, params.id)
  } catch (e) {
    responseStatus = 500
  }

  const responseOpt = {
    status: responseStatus
  }
  return new Response(JSON.stringify(responseData), responseOpt)
}