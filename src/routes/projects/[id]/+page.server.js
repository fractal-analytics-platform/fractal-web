import { fail } from '@sveltejs/kit'
import { getProject, getWorkflows, updateProject, createDataset, importWorkflow } from '$lib/server/api/v1/project_api'
import { createWorkflow } from '$lib/server/api/v1/workflow_api'
import { PostResourceException } from "../../../lib/common/errors.js";

export async function load({ fetch, params }) {
  console.log('Load project page')

  // Load project from Server
  const project = await getProject(fetch, params.id)
    .catch(error => console.error(error))

  const workflows = await getWorkflows(fetch, params.id)
    .catch(error => console.error(error))

  return {
    project: project || undefined,
    workflows: workflows || []
  }

}


export const actions = {

  update: async ({ fetch, request, params }) => {
    console.log('Update project resource action')

    const projectId = params.id
    const formData = await request.formData()

    const updatedProjectResponse = await updateProject(fetch, projectId, formData)
      .catch(error => {
        return fail(400, error.reason)
      })

    return updatedProjectResponse
  },

  createDataset: async ({ fetch, request, params }) => {

    const projectId = params.id
    const formData = await request.formData()

    const dataset = await createDataset(fetch, projectId, formData)
      .catch(error => {
        return fail(400, error.reason)
      })

    return dataset
  },

  createWorkflow: async ({ fetch, request, params }) => {

    const projectId = params.id
    const formData = await request.formData()

    console.log('Create workflow action', projectId, formData)

    const workflow = await createWorkflow(fetch, projectId, formData)
      .catch(error => {
        console.error('Error creating workflow', error)
        return fail(400, error.reason)
      })

    return workflow
  },

  importWorkflow: async ({ fetch, request, params }) => {
    console.log('Import workflow action')

    const formData = await request.formData()

    const workflowFile = formData.get('workflowFile')
    try {
      const workflowMetadata = await workflowFile.text()
        .then(text => JSON.parse(text))
        .catch(error => {
          throw new Error('The workflow file is not a valid JSON file', error)
        })

      const workflow = await importWorkflow(fetch, params.id, workflowMetadata)
        .catch(error => {
          console.error('Error importing workflow', error)
          throw new Error(JSON.stringify(error.reason))
        })

      return workflow
    }
    catch (error) {
      return fail(400, error.message)
    }
  }

}