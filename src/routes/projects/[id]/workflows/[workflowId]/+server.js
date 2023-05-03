import { fail } from '@sveltejs/kit'
import { deleteWorkflow } from '$lib/server/api/v1/workflow_api'

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