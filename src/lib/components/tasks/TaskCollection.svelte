<script>
  import { browser } from '$app/environment'
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import { onMount } from 'svelte'

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

  async function updateTaskCollectionsState() {
    const updatedTaskCollection = await Promise.all(taskCollections.map(async (taskCollection) => {
      switch (taskCollection.status){
        case 'pending':
        case 'installing':
          {
            // Internal server call with sveltekit server routing
            const response = await fetch('/api/collect-task/' + taskCollection.id)
            const taskCollectionUpdate = await response.json()
            // Update a task collection status with the one fetched from the server
            taskCollection.status = taskCollectionUpdate.data.status
          }
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
      return JSON.parse(window.localStorage.getItem('CollectionTasks')) || []
    }
    return []
  }

  function updateTaskCollections(updatedCollectionTasks) {
    if (browser) {
      window.localStorage.setItem('CollectionTasks', JSON.stringify(updatedCollectionTasks))
      taskCollections = updatedCollectionTasks
    }
  }

  function handleTaskCollection(collectActionResult) {
    if (collectActionResult.success) {
      // If the actionResult has succeeded, store the new collection task
      const taskCollection = collectActionResult.data
      // If the collection task is null, we should not proceed with other actions since is a package already collected
      // by the server.
      // Check that we're in browser environment
      if (taskCollection.id && browser) {
        // We shall push a new object representing a collection status in the list
        taskCollections.push({
          id: taskCollection.id,
          status: taskCollection.data.status,
          pkg: taskCollection.data.package,
          timestamp: taskCollection.timestamp
        })
        // Set the localStorage to updated list of collection tasks
        updateTaskCollections(taskCollections)
      }
    }
  }

  $: {
    if ($page.form && $page.form.collectTaskAction) {
      handleTaskCollection($page.form.collectTaskAction)
    }
  }

</script>

<p>Task collection component</p>
<div>
  <button class="btn btn-primary" on:click={updateTaskCollectionsState}><i class="bi bi-arrow-clockwise"></i></button>
  <ul>
  {#each taskCollections as { id, status, pkg }}
    <li>{id}; {status}; {pkg}</li>
  {/each}
  </ul>
</div>
<form method="post" action="?/collectTask" use:enhance>
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
