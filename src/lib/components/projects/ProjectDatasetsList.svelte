<script>
  import { deleteDataset } from '$lib/api/v1/project/project_api'
  import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte'

  export let datasets = []

  async function handleDatasetDelete(projectId, datasetId) {
    await deleteDataset(projectId, datasetId)
      .then(() => {
        // If the request is successful, we delete the dataset entry in the datasets list
        datasets = datasets.filter(d => {
          d.id !== datasetId
        })
      })
      .catch(error => {
        console.error(error)
      })
  }
</script>

<div class="container p-0 mt-4">
  <p class="lead">Datasets</p>
  <table class="table align-middle">
    <thead class="table-light">
    <tr>
      <th class="col-4">Name</th>
      <th class="col-4">Type</th>
      <th>Options</th>
    </tr>
    </thead>
    <tbody>
      {#each datasets as { name, type, project_id, id } }
        <tr>
          <td>{name}</td>
          <td>{type || 'Unknown' }</td>
          <td>
            <a class="btn btn-light" href="/projects/{project_id}/datasets/{id}">Detail</a>
            <ConfirmActionButton
              modalId="confirmDatasetDeleteModal{id}"
              style={'danger'}
              label={'Delete'}
              message={`Delete dataset ${name} from project ${project_id}`}
              callbackAction={handleDatasetDelete.bind(this, project_id, id)}>
            </ConfirmActionButton>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>