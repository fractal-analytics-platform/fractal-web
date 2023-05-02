import { deleteDataset } from '$lib/server/api/v1/project_api'

export async function DELETE({ fetch, params }) {

  const { id, datasetId } = params;

  console.log('DELETE project, dataset:', id, datasetId)

  return await deleteDataset(fetch, id, datasetId)
    .then(() => {
      return new Response(null, { status: 200 })
    })
    .catch(error => {
      console.log('Error deleting dataset', error.message)
      return new Response(error.message, { status: 500 })
    })

}