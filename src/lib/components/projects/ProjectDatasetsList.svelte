<script>
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import { createDataset, deleteDataset } from '$lib/api/v1/project/project_api'
  import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte'
  import StandardErrorAlert from '$lib/components/common/StandardErrorAlert.svelte'

  export let datasets = []

  let currentProjectId = $page.params.id

  async function handleCreateDataset({ form, data, cancel }) {
    // Prevent default post form
    cancel()

    const createdDataset = await createDataset(currentProjectId, data)
      .then(dataset => {
        form.reset()
        return dataset
      })
      .catch(error => {
        console.error(error)
        new StandardErrorAlert({
          target: document.getElementById('datasetCreateErrorAlert'),
          props: {
            error
          }
        })
      })

    datasets.push(createdDataset)
    // An assign should trigger the reload of UI trough svelte lifecycle hooks
    datasets = datasets
  }

  async function handleDatasetDelete(projectId, datasetId) {
    await deleteDataset(projectId, datasetId)
      .then(() => {
        // If the request is successful, we delete the dataset entry in the datasets list
        datasets = datasets.filter(d => {
          return d.id !== datasetId
        })
      })
      .catch(error => {
        console.error(error)
      })
  }
</script>

<div class="container p-0 mt-4">
  <p class="lead">Datasets</p>
  <div id="datasetCreateErrorAlert"></div>
  <table class="table align-middle caption-top">
    <caption class="text-bg-light border-top border-bottom pe-3 ps-3">
      <div class="d-flex align-items-center justify-content-end">
        <span class="fw-normal"></span>
        <div>
          <form method='post' class="row row-cols-lg-auto g-3 align-items-center" use:enhance={handleCreateDataset}>
            <div class="col-12">
              <div class="input-group">
                <div class="input-group-text">Name</div>
                <input type="text" class="form-control" placeholder="dataset name" name="datasetName" on:change={null}>
              </div>
            </div>
            <div class="col-12">
              <div class="input-group">
                <div class="form-check">
                  <input type="checkbox" class="form-check-input" name="datasetReadonly">
                  <div class="form-check-label">Is readonly</div>
                </div>
              </div>
            </div>
            <button class="btn btn-primary" type="submit">
              Create dataset
            </button>
          </form>
        </div>
      </div>
    </caption>
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
            <a class="btn btn-light" href="/projects/{project_id}/datasets/{id}">Open <i class="bi bi-arrow-up-right-square"></i></a>
            <ConfirmActionButton
              modalId="confirmDatasetDeleteModal{id}"
              style={'danger'}
              btnStyle="danger"
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