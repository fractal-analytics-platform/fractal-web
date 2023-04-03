<script>
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import { enhance } from '$app/forms'
  import { collectTaskErrorStore } from '$lib/stores/errorStores'
  import { modalTaskCollectionId } from '$lib/stores/taskStores'
  import { createTaskCollection, taskCollectionStatus } from '$lib/api/v1/task/task_api'
  import TaskCollectionLogsModal from '$lib/components/tasks/TaskCollectionLogsModal.svelte'
  import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte'

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

  // Component properties
  let taskCollections = []
  let taskCollectionAlreadyPresent = undefined

  // On component load set the taskCollections from the local storage
  onMount(async () => {
    if (browser) { taskCollections = loadTaskCollectionsFromStorage() }
    await updateTaskCollectionsState()
  })

  async function handleTaskCollection({ data, form, cancel }) {
    // Prevent form submission
    cancel()

    const packageName = data.get('package')

    await createTaskCollection(data)
      .then(taskCollection => {
        // Check that the taskCollection is not null
        // If null then, the taskCollection has already been requested
        if (taskCollection.status === 200) {
          // taskCollection.info = packageName.concat(': ', taskCollection.info)
          taskCollectionAlreadyPresent = taskCollection
          taskCollectionAlreadyPresent.package = packageName
          setTimeout(() => {
            taskCollectionAlreadyPresent = undefined
          }, 5500)
        } else {
          // If a version is specified, add it to taskCollection result
          const version = data.get('version')
          if (version !== undefined) {
            taskCollection.data.version = version
          }
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
      version: taskCollection.data.version,
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
          // When the status is ok
          // Only if the taskCollection logs are undefined
          if (taskCollection.logs === undefined) {
            // Shall fetch the verbose log of the task collection
            await taskCollectionStatus(taskCollection.id)
              .then(taskCollectionUpdate => {
                // Update a task collection status with the one fetched from the server
                taskCollection.status = taskCollectionUpdate.data.status
                taskCollection.logs = taskCollectionUpdate.data.log
                console.log(taskCollectionUpdate)
              })
              .catch(error => {
                console.error(error)
              })
          }
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

  function removeTaskCollection(taskCollectionId) {
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

  function setTaskCollectionLogsModal(event) {
    const id = event.currentTarget.getAttribute('data-fc-tc')
    modalTaskCollectionId.set(id)
  }

</script>

<TaskCollectionLogsModal></TaskCollectionLogsModal>

<div>
  {#if taskCollectionAlreadyPresent }
    <div id="task-collection-already-present" class="alert alert-success">
      <div>{taskCollectionAlreadyPresent.package}</div>
      <div class="mt-2 fw-bold">{taskCollectionAlreadyPresent.info}</div>
    </div>
  {/if}
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
              <ConfirmActionButton
                modalId="confirmClearTaskCollections"
                btnStyle="outline-secondary"
                buttonIcon="trash"
                label="Clear"
                message="Clear task collections requests"
                callbackAction={clearTaskCollections}
              >
              </ConfirmActionButton>
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
            <th>Version</th>
            <th>Status</th>
            <th>Options</th>
          </tr>
        </thead>
        <tbody>
        {#each taskCollections as { timestamp, status, version, pkg, id, logs }}
          <tr>
            <td class="col-2">{new Date(timestamp).toLocaleString()}</td>
            <td>{pkg}</td>
            <td class="col-1">
              <code>{version ? version : 'Unspecified' }</code>
            </td>
            <td class="col-1"><span class="badge {statusBadge(status)}">{status}</span></td>
            <td class="col-2">
              <ConfirmActionButton
                modalId="removeTaskCollectionModal{id}"
                btnStyle="warning"
                buttonIcon="trash"
                message="Remove a task collection log"
                callbackAction={removeTaskCollection.bind(this, id)}
              ></ConfirmActionButton>
              {#if status == 'fail' || (status == 'OK' && logs !== '') }
                <button class="btn btn-info" data-fc-tc="{id}" data-bs-toggle="modal" data-bs-target="#collectionTaskLogsModal" on:click={setTaskCollectionLogsModal}>
                  <i class="bi bi-info-circle"></i>
                </button>
              {/if}
            </td>
          </tr>
        {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

