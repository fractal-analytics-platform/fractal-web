<script>
  import { onMount } from 'svelte'
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import { getWorkflow, createWorkflowTask } from '$lib/api/v1/workflow/workflow_api'
  import { listTasks } from '$lib/api/v1/task/task_api'
  import ArgumentForm from '$lib/components/workflow/ArgumentForm.svelte'

  let workflow = undefined
  // List of available tasks to be inserted into workflow
  let availableTasks = []

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
      .catch(error => {
        console.error(error)
      })

    console.log(workflowTask)

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
  <div class="d-flex justify-content-between align-items-center">
    <h1>Workflow {workflow.name} #{$page.params.workflowId}</h1>
    <button class="btn btn-primary m-3" data-bs-toggle="modal" data-bs-target="#insertTaskModal" on:click={getAvailableTasks}>New workflow task</button>
  </div>
  <div class="container m-0 ps-0">
    <div class="row">
      <div class="accordion" id="workflowList">

        {#each workflow.task_list as workflowTask }
          <div class="accordion-item">

            <div class="accordion-header">
              <div></div>
              <button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#workflowItem-{workflowTask.id}">
                Order{workflowTask.order} #{workflowTask.id} - {workflowTask.task.name}
              </button>
            </div>
            <div id="workflowItem-{workflowTask.id}" class="accordion-collapse collapse">
              <div class="accordion-body">
                <ArgumentForm workflowTaskArgs={workflowTask.args} workflowId={workflow.id} workflowTaskId={workflowTask.id}></ArgumentForm>
              </div>
            </div>

          </div>
        {/each}

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

          <button class="btn btn-primary">Insert</button>
        </form>
      </div>
    </div>
  </div>
</div>