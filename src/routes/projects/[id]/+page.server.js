import { fail } from '@sveltejs/kit'
import { getProject, getWorkflows, updateProject } from '$lib/server/api/v1/project_api'

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
  }


}