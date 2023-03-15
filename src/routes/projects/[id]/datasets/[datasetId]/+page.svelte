<script>
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { enhance } from '$app/forms'
  import { getDataset, updateDataset, deleteDatasetResource, createDatasetResource } from '$lib/api/v1/project/project_api'
  import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte'
  import StandardErrorAlert from '$lib/components/common/StandardErrorAlert.svelte'

  let projectId = $page.params.id
  let datasetId = $page.params.datasetId

  let dataset = undefined
  let updateDatasetSuccess = false
  let createResourceSuccess = false

  onMount(async () => {
    dataset = await getDataset(projectId, datasetId)
      .catch(error => {
        console.error(error)
      })
  })

  async function handleDatasetUpdate({ form, data, cancel }) {
    // Prevent default
    cancel()

    await updateDataset(projectId, datasetId, data)
      .then(updatedDataset => {
        dataset = updatedDataset
        updateDatasetSuccess = true
        setTimeout(() => {
          updateDatasetSuccess = false
        }, 1200)
      })
      .catch(error => {
        new StandardErrorAlert({
          target: document.getElementById('updateDatasetError'),
          props: {
            error
          }
        })
      })

  }

  async function handleCreateDatasetResource({ form, data, cancel }) {
    // Prevent default
    cancel()

    await createDatasetResource(projectId, datasetId, data)
      .then(resource => {
        dataset.resource_list.push(resource)
        // This is required in order to trigger svelte reactivity
        dataset.resource_list = dataset.resource_list
        createResourceSuccess = true
        // Get a reference to the modal
        // eslint-disable-next-line no-undef
        // noinspection JSUnresolvedVariable
        const modal = bootstrap.Modal.getInstance(document.getElementById('createDatasetResourceModal'))
        setTimeout(() => {
          createResourceSuccess = false
          modal.toggle()
        }, 1200)
        form.reset()
      })
      .catch(error => {
        new StandardErrorAlert({
          target: document.getElementById('createDatasetResourceError'),
          props: {
            error
          }
        })
      })

  }

  async function handleDeleteDatasetResource(resourceId) {

    await deleteDatasetResource(projectId, datasetId, resourceId)
      .then(() => {
        dataset.resource_list = dataset.resource_list.filter(r => r.id !== resourceId)
      })
      .catch(error => {
        console.error(error)
      })
  }

</script>

<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
    <li class="breadcrumb-item" aria-current="page">
      <a href="/projects">Projects</a>
    </li>
    <li class="breadcrumb-item" aria-current="page">
      <a href="/projects/{projectId}">Project</a>
    </li>
    <li class="breadcrumb-item" aria-current="page">Datasets</li>
    {#if dataset}
      <li class="breadcrumb-item active" aria-current="page">{dataset.name}</li>
    {/if}
  </ol>
</nav>

{#if dataset}
  <div class="container px-0">
  <h1>Dataset {dataset.name} #{dataset.id}</h1>

  <div class="row mt-2">

    <div class="col-4">
      <div class="d-flex align-items-center justify-content-between">
        <span class="lead py-3">Dataset properties</span>
        <a href="#" class="btn btn-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#updateDatasetModal">Edit dataset</a>
      </div>
      <ul class="list-group">
        <li class="list-group-item text-bg-light">
          <span>Id</span>
        </li>
        <li class="list-group-item">
          <span>{dataset.id}</span>
        </li>
        <li class="list-group-item text-bg-light">
          <span>Name</span>
        </li>
        <li class="list-group-item">
          <span>{dataset.name}</span>
        </li>
        <li class="list-group-item text-bg-light">
          <span>Type</span>
        </li>
        <li class="list-group-item">
          <span>{dataset.type}</span>
        </li>
        <li class="list-group-item text-bg-light">
          <span>Readonly</span>
        </li>
        <li class="list-group-item">
          <span class="badge bg-secondary">{dataset.read_only}</span>
        </li>
      </ul>
      {#if Object.keys(dataset.meta).length > 0 }
        <p class="text-muted mt-3">Meta properties</p>
        <ul class="list-group">
          {#each Object.entries(dataset.meta) as [key, value] }
            <li class="list-group-item text-bg-light">
              <span class="text-capitalize">{key}</span>
            </li>
            <li class="list-group-item">
              <span class="">{value}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
    <div class="col-8">
      <div class="d-flex align-items-center justify-content-between">
        <span class="lead py-3">Dataset resources</span>
        <a href="#" class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#createDatasetResourceModal">New resource</a>
      </div>
      <table class="table table-bordered caption-top align-middle">
        <thead class="bg-light">
          <tr>
            <th class="col-1">Id</th>
            <th class="col-9">Source</th>
            <th class="col-2">Options</th>
          </tr>
        </thead>
        <tbody>
        {#each dataset.resource_list as resource }
          <tr>
            <td>{resource.id}</td>
            <td><code>{resource.path}</code></td>
            <td>
              <ConfirmActionButton
              modalId="confirmDeleteResource{resource.id}"
              style="danger"
              btnStyle="danger"
              label="Delete"
              message="Delete a dataset resource"
              callbackAction={handleDeleteDatasetResource.bind(this, resource.id)}
              buttonIcon="trash">
              </ConfirmActionButton>
            </td>
          </tr>
        {/each}
        </tbody>
      </table>
    </div>

  </div>

  </div>
{/if}

<div class="modal" id="createDatasetResourceModal">
  <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Create dataset resource</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <div id="createDatasetResourceError"></div>

        <form method="post" use:enhance={handleCreateDatasetResource}>

          <div class="mb-3">
            <label for="source" class="form-label">Resource path</label>
            <input class="form-control" type="text" name="source" id="source">
          </div>

          <button class="btn btn-primary">
            Create
          </button>
        </form>

        {#if createResourceSuccess }
          <p class="alert alert-success mt-3">Resource created</p>
        {/if}
      </div>
    </div>
  </div>
</div>

{#if dataset }
<div class="modal" id="updateDatasetModal">
  <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Update dataset properties</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <div id="updateDatasetError"></div>

        <form method="post" use:enhance={handleDatasetUpdate}>

          <div class="mb-3">
            <label for="name" class="form-label">Dataset name</label>
            <input class="form-control" type="text" name="name" id="name" value="{dataset.name}">
          </div>
          <div class="mb-3">
            <label for="type" class="form-label">Dataset type</label>
            <input class="form-control" type="text" name="type" id="type" value="{dataset.type}">
          </div>
          <div class="mb-3">
            <input class="form-check-input" type="checkbox" name="read_only" id="read_only" checked={dataset.read_only}>
            <label for="read_only" class="form-check-label">Readonly dataset?</label>
          </div>

          <div class="d-flex align-items-center">
            <button class="btn btn-primary me-3">Update</button>
            {#if updateDatasetSuccess }
              <span class="text-success">Dataset properties updated with success</span>
            {/if}
          </div>
        </form>

      </div>
    </div>
  </div>
</div>
{/if}