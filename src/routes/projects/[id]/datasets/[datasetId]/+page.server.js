import { getProject, getDataset } from '$lib/server/api/v1/project_api'

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