import { deleteDatasetResource } from '$lib/server/api/v1/project_api'


export async function DELETE({ fetch, params }) {
  console.log('DELETE Dataset Resource')

  const { id, datasetId, resourceId } = params

  try {
    await deleteDatasetResource(fetch, id, datasetId, resourceId)
    return new Response(null, { status: 204 })
  }
  catch (error) {
    console.error(error)
    return new Response(error.reason, { status: 500 })
  }

}