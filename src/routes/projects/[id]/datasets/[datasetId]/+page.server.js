import { fail } from '@sveltejs/kit'
import { getProject, getDataset, updateDataset } from '$lib/server/api/v1/project_api'

export async function load({ fetch, request, params }){
  console.log('Load Dataset Page')

  const { id, datasetId } = params

  const project = await getProject(fetch, id)
    .catch(error => {
      console.error(error)
      return null
    })

  const dataset = await getDataset(fetch, id, datasetId)
    .catch(error => {
      console.error(error)
      return null
    })

  return {
    dataset,
    project
  }
}

export const actions = {

  // Default action - Update dataset properties
  default: async ({ fetch, request, params }) => {

    console.log('Update Dataset Properties')

    const { id, datasetId } = params
    const formData = await request.formData()

    // Validation
    const name = formData.get('name')
    if (name === null || name === '') {
      return fail(400, 'The dataset name can not be empty')
    }

    try {
      const dataset = await updateDataset(fetch, id, datasetId, formData)
      return dataset
    }
    catch (error) {
      console.error(error)
      return fail(500, error.reason)
    }

  }

}