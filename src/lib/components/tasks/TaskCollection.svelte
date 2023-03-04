<script>
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import { enhance } from '$app/forms'
  import { collectTaskErrorStore } from '$lib/stores/errorStores'
  import { createTaskCollection, taskCollectionStatus } from '$lib/api/v1/task/task_api'
  // import TaskCollectionLogsModal from '$lib/components/tasks/TaskCollectionLogsModal.svelte'

  const LOCAL_STORAGE_TASK_COLLECTIONS = 'TaskCollections'

  // This component, when receives a collectTaskAction successful result
  // should store in local storage the collection request id
  // successive reloads of the list of collection requests shall update
  // the status of collections
  // List of collection status:
  // -  installing
  // -  collecting
  // -  fail
  // -  ok
  // If a collection status is ok, the component shall remove the collection
  // request from the localStorage
  // If a collection status is fail, the component shall request the logs
  // If a collection status is collecting, the component shall fetch update
  // If a collection status is installing, the component shall fetch update

  let taskCollections = []

  // On component load set the taskCollections from the local storage
  onMount(async () => {
    if (browser) { taskCollections = loadTaskCollectionsFromStorage() }
    await updateTaskCollectionsState()
  })

  async function handleTaskCollection({ data, form, cancel }) {
    // Prevent form submission
    cancel()

    await createTaskCollection(data)
      .then(taskCollection => {
        console.log(taskCollection)
        // Check that the taskCollection is not null
        // If null then, the taskCollection has already been requested
        if (taskCollection.id === null) {
          console.log('Task collection already happened')
        } else {
          // Add task collection to local storage
          storeCreatedTaskCollection(taskCollection)
        }
        form.reset()
      })
      .catch(error => {
        collectTaskErrorStore.set(error)
      })

  }

  function storeCreatedTaskCollection(taskCollection) {
    taskCollections.push({
      id: taskCollection.id,
      status: taskCollection.data.status,
      pkg: taskCollection.data.package,
      timestamp: taskCollection.timestamp
    })
    updateTaskCollections(taskCollections)
  }

  async function updateTaskCollectionsState() {
    const updatedTaskCollection = await Promise.all(taskCollections.map(async (taskCollection) => {
      switch (taskCollection.status){
        case 'pending':
        case 'installing':
          {
            await taskCollectionStatus(taskCollection.id)
              .then(taskCollectionUpdate => {
                // Update a task collection status with the one fetched from the server
                taskCollection.status = taskCollectionUpdate.data.status
              })
              .catch(error => {
                console.error(error)
              })
          }
          break
        case 'fail':
          break
        default:
          break
      }
      // Return the updated taskCollection object
      return taskCollection
    }))
    // Update task collections list
    updateTaskCollections(updatedTaskCollection)
  }

  function loadTaskCollectionsFromStorage() {
    if (browser) {
      // Parse local storage task collections value
      return JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_TASK_COLLECTIONS)) || []
    }
    // Fallback to empty task collections list
    return []
  }

  function updateTaskCollections(updatedCollectionTasks) {
    if (browser) {
      window.localStorage.setItem(LOCAL_STORAGE_TASK_COLLECTIONS, JSON.stringify(updatedCollectionTasks))
      taskCollections = updatedCollectionTasks
    }
  }

  function clearTaskCollections() {
    updateTaskCollections([])
  }

  function removeTaskCollection(event) {
    const taskCollectionId = event.currentTarget.getAttribute('data-fc-tc')
    updateTaskCollections(taskCollections.filter(tc => tc.id != taskCollectionId))
  }

  // Component utilities
  function statusBadge(status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-bg-light'
      case 'installing':
        return 'text-bg-primary'
      case 'fail':
        return 'text-bg-danger'
      case 'ok':
        return 'text-bg-success'
    }
  }

</script>

<div>
  <form method="post" use:enhance={handleTaskCollection}>
    <div class="row g-3">
      <div class="col-6">
        <div class="input-group">
          <div class="input-group-text">
            <span class="font-monospace">Package</span>
          </div>
          <input name="package" type="text" class="form-control" required>
        </div>
      </div>
      <div class="col-6">
        <div class="input-group">
          <div class="input-group-text">
            <span class="font-monospace">Version</span>
          </div>
          <input name="version" type="text" class="form-control">
        </div>
      </div>
      <div class="col-6">
        <div class="input-group">
          <div class="input-group-text">
            <span class="font-monospace">Python Version</span>
          </div>
          <input name="python_version" type="text" class="form-control">
        </div>
      </div>
      <div class="col-6">
        <div class="input-group">
          <div class="input-group-text">
            <span class="font-monospace">Package extras</span>
          </div>
          <input name="package_extras" type="text" class="form-control">
        </div>
      </div>
      <div class="col-auto">
        <button type="submit" class="btn btn-primary">Collect</button>
      </div>
    </div>
  </form>
  {#if taskCollections.length > 0 }
    <hr>
    <div class="">
      <table class="table table-hover caption-top align-middle">
        <caption class="text-bg-light border-top border-bottom pe-3 ps-3">
          <div class="d-flex align-items-center justify-content-between">
            <span class="fw-normal">Task collections</span>
            <div>
              <button class="btn btn-outline-secondary" on:click={clearTaskCollections}>
                Clear
                <i class="bi bi-trash"></i>
              </button>
              <button class="btn btn-primary" on:click={updateTaskCollectionsState}>
                Refresh <i class="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>
        </caption>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Package</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
        {#each taskCollections as { timestamp, status, pkg, id }}
          <tr>
            <td class="col-2">{new Date(timestamp).toLocaleString()}</td>
            <td>{pkg}</td>
            <td class="col-2"><span class="badge {statusBadge(status)}">{status}</span></td>
            <td class="col-1">
              <button class="btn btn-light" data-fc-tc="{id}" on:click={null}>
                <i class="bi bi-info-circle"></i>
              </button>
              <button class="btn btn-warning" data-fc-tc="{id}" on:click={removeTaskCollection}>
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

