import { taskCollectionStatus } from '$lib/server/api/v1/task_api'

export async function GET({ fetch, params }) {

  const { collectionId } = params

  try {
    const taskCollection = await taskCollectionStatus(fetch, collectionId)
    return new Response(JSON.stringify(taskCollection), { status: 200 })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify(error), { status: 422 })
  }

}