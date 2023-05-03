import { getWorkflow } from '$lib/server/api/v1/workflow_api'
import { getProject } from '$lib/server/api/v1/project_api'

export async function load({ fetch, params }) {
  console.log('Load workflow page')

  const { id, workflowId } = params

  // Get the project
  const project = await getProject(fetch, id)
    .catch(error => {
      console.error('Error getting project', error)
      return null
    })

  // Get the workflow
  const workflow = await getWorkflow(fetch, workflowId)
    .catch(error => {
      console.error('Error getting workflow', error)
      return null
    })

  // Get available tasks
  const datasets = project ? project.dataset_list : []


  return {
    project,
    workflow,
    datasets
  }
}