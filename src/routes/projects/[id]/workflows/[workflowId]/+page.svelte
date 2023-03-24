<script>
  import { onMount } from 'svelte'
  import { writable } from 'svelte/store'
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import { getWorkflow, createWorkflowTask } from '$lib/api/v1/workflow/workflow_api'
  import { listTasks } from '$lib/api/v1/task/task_api'
  import ArgumentForm from '$lib/components/workflow/ArgumentForm.svelte'

  let workflow = undefined
  // List of available tasks to be inserted into workflow
  let availableTasks = []

  let workflowTaskContext = writable(undefined)

  let workflowTabContextId = 0

  onMount(async () => {
    workflow = await getWorkflow($page.params.workflowId)
      .catch(error => {
        console.error(error)
      })

    console.log(workflow)
  })

  async function getAvailableTasks() {
    // Get available tasks from the server
    availableTasks = await listTasks()
      .catch(error => {
        console.error(error)
        return []
      })
  }

  async function handleCreateWorkflowTask({ form, data, cancel }) {
    // Prevent default
    cancel()

    const workflowTask = await createWorkflowTask(workflow.id, data)
      .then(async () => {
        form.reset()
        workflow = await getWorkflow(workflow.id)
        // eslint-disable-next-line no-undef
        const modal = bootstrap.Modal.getInstance(document.getElementById('insertTaskModal'))
        modal.toggle()
      })
      .catch(error => {
        console.error(error)
      })
  }

  async function setActiveWorkflowTaskContext(event) {
    const workflowTaskId = event.currentTarget.getAttribute('data-fs-target')
    const wft = workflow.task_list.find(task => task.id == workflowTaskId)
    workflowTaskContext.set(wft)
  }

</script>

<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
    <li class="breadcrumb-item" aria-current="page">
      <a href="/projects">Projects</a>
    </li>
    {#if $page.params.id}
      <li class="breadcrumb-item" aria-current="page">
        <a href="/projects/{$page.params.id}">{$page.params.id}</a>
      </li>
    {/if}
    <li class="breadcrumb-item">
      Workflows
    </li>
    {#if workflow }
    <li class="breadcrumb-item active">
      { workflow.name }
    </li>
    {/if}
  </ol>
</nav>

{#if workflow }
  <div class="container">
    <div class="d-flex justify-content-between align-items-center">
      <h1>Workflow {workflow.name} #{$page.params.workflowId}</h1>
      <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#insertTaskModal" on:click={getAvailableTasks}>New workflow task</button>
    </div>
    <div class="row">
      <div class="col-4">
        <div class="card">
          <div class="card-header">
            Workflow sequence
          </div>

          <ul class="list-group list-group-flush">
            {#each workflow.task_list as workflowTask }
              <li style="cursor: pointer"
                  class="list-group-item list-group-item-action {$workflowTaskContext !== undefined && $workflowTaskContext.id == workflowTask.id ? 'active' : ''}"
                  data-fs-target={workflowTask.id}
                  on:click|preventDefault={setActiveWorkflowTaskContext}>
                {workflowTask.task.name} #{workflowTask.id}
              </li>
            {/each}
          </ul>
        </div>
      </div>
      <div class="col-8">
        <div class="card">
          <div class="card-header">
            {#if $workflowTaskContext}
              <div class="mb-3">
                Workflow task {$workflowTaskContext.task.name}
              </div>
              <ul class="nav nav-tabs card-header-tabs">
                <li class="nav-item">
                  <a class="nav-link {workflowTabContextId === 0 ? 'active' : ''}" aria-current="true" href="#" on:click|preventDefault={null}>Arguments</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link {workflowTabContextId === 1 ? 'active' : ''}" href="#" on:click|preventDefault={null}>Meta</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link disabled">Info</a>
                </li>
              </ul>
            {:else}
              Select a workflow task from the list
            {/if}
          </div>
          <div class="card-body">
            {#if $workflowTaskContext }
              <ArgumentForm workflowTaskArgs={$workflowTaskContext.args} workflowId={workflow.id} workflowTaskId={$workflowTaskContext.id}></ArgumentForm>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<div class="modal" id="insertTaskModal">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">New workflow task</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <form method="post" use:enhance={handleCreateWorkflowTask}>

          <div class="mb-3">
            <label for="taskId" class="form-label">Select task</label>
            <select name="taskId" id="taskId" class="form-select">
              <option selected>Select an available task</option>
              {#each availableTasks as task }
                <option value="{task.id}">{task.name}</option>
              {/each}
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label">Task order in workflow</label>
            <input type="number" name="taskOrder" class="form-control" placeholder="Leave it blank to append at the end" min="0" max="{workflow?.task_list.length}">
          </div>

          <button class="btn btn-primary">Insert</button>
        </form>
      </div>
    </div>
  </div>
</div>