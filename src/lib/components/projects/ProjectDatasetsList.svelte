<script>
  import { deleteDataset } from '$lib/api/v1/project/project_api'
  export let datasets = []

  async function handleDatasetDelete(event) {
    const projectId = event.currentTarget.getAttribute('data-fc-project')
    const datasetId = event.currentTarget.getAttribute('data-fc-dataset')
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

<div class="container p-0">
  <p class="lead">Datasets</p>
  <table class="table align-middle">
    <thead class="table-light">
    <tr>
      <th>Name</th>
      <th>Type</th>
      <th>Options</th>
    </tr>
    </thead>
    <tbody>
      {#each datasets as { name, type, project_id, id } }
        <tr>
          <td>{name}</td>
          <td>{type || 'Unknown' }</td>
          <td>
            <button class="btn btn-danger" on:click={handleDatasetDelete} data-fc-project="{project_id}" data-fc-dataset="{id}">Delete</button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>