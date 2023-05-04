import { fail } from '@sveltejs/kit'
import { deleteWorkflow, reorderWorkflow } from '$lib/server/api/v1/workflow_api'

export async function DELETE({ fetch, params }) {
  console.log('DELETE workflow')

  const { workflowId } = params

  try {
    await deleteWorkflow(fetch, workflowId)
    return new Response(null, { status: 204})
  }
  catch (error) {
    return fail(500, error.message)
  }

}

export async function PATCH({ fetch, request, params }) {
  console.log('PATCH workflow - reorder workflow tasks')

  const { workflowId } = params
  const { tasksOrder } = await request.json()

  try {
    const updatedWorkflow = await reorderWorkflow(fetch, workflowId, tasksOrder)
    // Return updated workflow as JSON embedded in response body
    return new Response(JSON.stringify(updatedWorkflow), { status: 200})
  }
  catch (error) {
    return fail(500, error.message)
  }

}