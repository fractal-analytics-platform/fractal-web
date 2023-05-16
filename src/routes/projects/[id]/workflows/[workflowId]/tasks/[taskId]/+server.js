import { fail } from '@sveltejs/kit'
import { getWorkflow, deleteWorkflowTask, updateWorkflowTaskArguments, updateWorkflowTaskMetadata } from '$lib/server/api/v1/workflow_api'

export async function DELETE({ fetch, params }) {
  console.log('Delete workflow task')

  const { workflowId, taskId } = params

  try {
    await deleteWorkflowTask(fetch, workflowId, taskId)  // FIXME: needs projectID
    // Get updated workflow with created task
    const workflow = await getWorkflow(fetch, workflowId)  // FIXME: needs projectID
    return new Response(JSON.stringify(workflow), { status: 200 })
  } catch (error) {
    console.error(error)
    return fail(500, error.reason)
  }
}

export async function PATCH({ fetch, params, request }){
  console.log('PATCH Update workflow task properties')

  const data = await request.json()
  const updateArgs = data.args
  const updateMeta = data.meta

  const { workflowId, taskId } = params

  try {
    let updatedWorkflowTask
    if (updateArgs) {
      updatedWorkflowTask = await updateWorkflowTaskArguments(fetch, workflowId, taskId, updateArgs)  // FIXME: needs projectID
    } else if (updateMeta) {
      updatedWorkflowTask = await updateWorkflowTaskMetadata(fetch, workflowId, taskId, updateMeta)  // FIXME: needs projectID
    }
    return new Response(JSON.stringify(updatedWorkflowTask), { status: 200 })
  } catch (error) {
    console.error(error)
    return fail(500, error.reason)
  }
}