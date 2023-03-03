<script>
  import { enhance } from '$app/forms'
  import { taskModal } from '$lib/stores/taskStores'
  import TaskInfoModal from '$lib/components/tasks/TaskInfoModal.svelte'
  import TaskCollection from '$lib/components/tasks/TaskCollection.svelte'
  export let data
  export let form

  // Error property to be set in order to show errors in UI
  let errorReasons = ''
  // Tasks property updated with respect to data store
  let tasks = []

  $: tasks = data.tasks

  function actionResult(result) {
    if (result) {
      if (result.createAction && !result.createAction.success) {
        // errorReasons = JSON.stringify(result.createAction.reason, undefined, 2)
        setErrorReasons(result.createAction.reason)
      }

      if (result.collectTaskAction && !result.collectTaskAction.success) {
        setErrorReasons(result.collectTaskAction.reason)
      }
    }

    if (result && result.createAction && result.createAction.success) {
      // Success logic
    }
  }

  function setErrorReasons(value) {
    errorReasons = JSON.stringify(value, undefined, 2)
  }

  function setTaskModal(event) {
    const taskId = event.currentTarget.getAttribute('data-fc-task')
    const task = tasks.find(t => t.id == taskId)
    taskModal.set(task)
  }

  async function reloadTaskList() {
    const updatedTaskList = await fetch('/api/task', {
      method: 'GET'
    })
      .then(response => response.json())
    tasks = updatedTaskList
  }

  $: actionResult(form)
</script>

<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
    <li class="breadcrumb-item active" aria-current="page">Tasks</li>
  </ol>
</nav>

<TaskInfoModal></TaskInfoModal>

<div class="mb-3">
  {#if errorReasons != '' }
    <div class="col-12">
      <div class="alert alert-danger alert-dismissible">
        <pre>There has been an error, reason:</pre>
        <pre>{errorReasons}</pre>
        <button class="btn-close" data-bs-dismiss="alert" on:click={errorReasons = ''}></button>
      </div>
    </div>
  {/if}
</div>
<p class="lead">Insert task</p>
<div class="accordion">
  <div class="accordion-item">
    <h2 class="accordion-header">
      <button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#taskCollection">
        Collect multiple tasks
      </button>
    </h2>
    <div id="taskCollection" class="accordion-collapse collapse">
      <div class="accordion-body">
        <TaskCollection></TaskCollection>
      </div>
    </div>
  </div>
  <div class="accordion-item">
    <h2 class="accordion-header">
      <button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#addTask">
        Add a task
      </button>
    </h2>
    <div id="addTask" class="accordion-collapse collapse">
      <div class="accordion-body">
        <form method="post" action="?/create" class="" use:enhance>
          <div class="row g-3">
            <div class="col-6">
              <div class="input-group">
                <div class="input-group-text">Task name</div>
                <input name="name" type="text" class="form-control">
              </div>
            </div>
            <div class="col-12">
              <div class="input-group">
                <div class="input-group-text">Command</div>
                <input name="command" type="text" class="form-control">
              </div>
            </div>
            <div class="col-6">
              <div class="input-group">
                <div class="input-group-text">Source</div>
                <input name="source" type="text" class="form-control">
              </div>
            </div>
            <div class="row">

            </div>
            <div class="col-6">
              <div class="input-group">
                <div class="input-group-text">Input type</div>
                <input name="input_type" type="text" class="form-control">
              </div>
            </div>
            <div class="col-6">
              <div class="input-group">
                <div class="input-group-text">Output type</div>
                <input name="output_type" type="text" class="form-control">
              </div>
            </div>
            <div class="col-auto">
              <button type="submit" class="btn btn-primary">Create</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>

<div class="row mt-4">
  <p class="lead">Task list</p>
  <div class="col-12">
    <table class="table caption-top align-middle">
      <caption class="text-bg-light border-top border-bottom pe-3 ps-3">
        <div class="d-flex align-items-center justify-content-between">
          <span class="fw-normal"></span>
          <div>
            <button class="btn btn-outline-primary" on:click={reloadTaskList}>
              <i class="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>
      </caption>
      <thead class="table-light">
      <tr>
        <th>Name</th>
        <th>Source</th>
        <th>Options</th>
      </tr>
      </thead>
      <tbody>
      {#each tasks as task}
        <tr>
          <td class="col-2">{task.name}</td>
          <td><code>{task.source}</code></td>
          <td class="col-2">
            <button data-fc-task="{task.id}" class="btn btn-light" data-bs-toggle="modal" data-bs-target="#taskInfoModal" on:click={setTaskModal}>
              <i class="bi bi-info-circle"></i>
            </button>
            <button class="btn btn-danger" disabled>
              Delete
            </button>
          </td>
        </tr>
      {/each}
      </tbody>
    </table>
  </div>
</div>