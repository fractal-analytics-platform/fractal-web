<script>
  import { onMount } from 'svelte'
  import { writable } from 'svelte/store'
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import { contextProject } from '$lib/stores/projectStores'
  import { getWorkflow, updateWorkflow, reorderWorkflow, exportWorkflow, createWorkflowTask, deleteWorkflowTask, applyWorkflow } from '$lib/api/v1/workflow/workflow_api'
  import { listTasks } from '$lib/api/v1/task/task_api'
  import ArgumentForm from '$lib/components/workflow/ArgumentForm.svelte'
  import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte'
  import StandardErrorAlert from '$lib/components/common/StandardErrorAlert.svelte'
  import MetaPropertiesForm from '$lib/components/workflow/MetaPropertiesForm.svelte'

  let workflow = undefined
  let project = $contextProject.project
  let datasets = $contextProject.datasets || []

  $: updatableWorkflowList = workflow ? workflow.task_list : []
  // List of available tasks to be inserted into workflow
  let availableTasks = []

  let workflowTaskContext = writable(undefined)

  let workflowTabContextId = 0

  let selectedWorkflowTask = undefined

  workflowTaskContext.subscribe((value) => {
    selectedWorkflowTask = value
  })

  async function loadWorkflow() {
    workflow = await getWorkflow($page.params.workflowId)
      .catch(error => {
        console.error(error);
      });
  }

  onMount(async () => {
    await loadWorkflow();
  })

  async function handleExportWorkflow(event) {

    const workflowData = await exportWorkflow(workflow.id)
      .catch(error => {
        console.error(error);
        return null
      })

    if (workflowData !== null) {
      const file = new File([JSON.stringify(workflowData, '', 2)], `workflow-export-${workflow.name}-${Date.now().toString()}.json`, {
        type: `application/json`,
      })
      const fileUrl = URL.createObjectURL(file)
      const linkElement = document.getElementById('downloadWorkflowButton')
      linkElement.download = `workflow-export-${workflow.name}-${Date.now().toString()}.json`
      linkElement.href = fileUrl
      linkElement.click()
    }

  }

  async function getAvailableTasks() {
    // Get available tasks from the server
    availableTasks = await listTasks()
      .catch(error => {
        console.error(error)
        return []
      })
  }

  async function handleWorkflowUpdate({ form, data, cancel }) {
    // Prevent default
    cancel()

    await updateWorkflow(workflow.id, data)
      .then(() => {
        loadWorkflow()
        // eslint-disable-next-line no-undef
        const modal = bootstrap.Modal.getInstance(document.getElementById('editWorkflowModal'))
        modal.toggle()
      })
      .catch(error => {
        console.error(error)
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

  async function handleDeleteWorkflowTask(workflowId, workflowTaskId) {
    await deleteWorkflowTask(workflowId, workflowTaskId)
      .then(() => {
        // Succesffully deleted task
        loadWorkflow()
        workflowTaskContext.set(undefined)
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

  function moveWorkflowTask(index, direction) {
    const wftList = updatableWorkflowList

    let replaceId
    switch (direction) {
      case 'up':
        if (index === 0) break
        replaceId = index - 1
        break
      case 'down':
        if (index === wftList.length - 1) break
        replaceId = index + 1
    }

    const replaceTask = wftList[replaceId]
    wftList[replaceId] = wftList[index]
    wftList[index] = replaceTask
    updatableWorkflowList = wftList
  }

  async function handleWorkflowOrderUpdate(event) {

    await reorderWorkflow(workflow.id, updatableWorkflowList.map(t => t.id))
      .then((updatedWorkflow) => {
        workflow = updatedWorkflow
        const modal = bootstrap.Modal.getInstance(document.getElementById('editWorkflowTasksOrderModal'))
        modal.toggle()
      })
      .catch(error => {
        console.error(error)
      })
  }

  async function handleApplyWorkflow({ form, data, cancel}) {
    // Prevent default
    cancel()

    await applyWorkflow(project.id, workflow.id, data)
      .then(() => {
        // eslint-disable-next-line no-undef
        const modal = bootstrap.Modal.getInstance(document.getElementById('runWorkflowModal'))
        modal.toggle()
        form.reset()
      })
      .catch(error => {
        console.error(error)
        // Set an error message on the component
        new StandardErrorAlert({
          target: document.getElementById('applyWorkflowError'),
          props: {
            error
          }
        })
      })
  }

</script>

<div class="d-flex justify-content-between align-items-center">
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
  <div>
    <button class="btn btn-light" on:click|preventDefault={handleExportWorkflow}><i class="bi-box-arrow-up"></i></button>
    <a id="downloadWorkflowButton" class="d-none">Download workflow link</a>
    <button class="btn btn-light" data-bs-toggle="modal" data-bs-target="#editWorkflowModal"><i class="bi-gear-wide-connected"></i></button>
    <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#runWorkflowModal"><i class="bi-play-fill"></i> Run workflow</button>
  </div>
</div>


{#if workflow }
  <div class="container">
    <div class="d-flex justify-content-between align-items-center my-3">
      <h1>Workflow {workflow.name} #{$page.params.workflowId}</h1>
    </div>
    <div class="row">
      <div class="col-4">
        <div class="card">
          <div class="card-header">
            <div class="d-flex justify-content-between align-items-center">
              <span>Workflow sequence</span>
              <div>
                <button class="btn btn-light" data-bs-toggle="modal" data-bs-target="#insertTaskModal" on:click={getAvailableTasks}><i class="bi-plus-lg"></i></button>
                <button class="btn btn-light" data-bs-toggle="modal" data-bs-target="#editWorkflowTasksOrderModal"><i class="bi-gear-wide-connected"></i></button>
              </div>
            </div>
          </div>

          {#if workflow.task_list.length == 0 }
            <p class="text-center mt-3">No workflow tasks yet, add one.</p>
          {:else}
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
          {/if}
        </div>
      </div>
      <div class="col-8">
        <div class="card">
          <div class="card-header">
            {#if selectedWorkflowTask}
              <div class="d-flex mb-3 justify-content-between align-items-center">
                <div>
                  Workflow task {selectedWorkflowTask.task.name}
                </div>
                <ConfirmActionButton
                  modalId="confirmDeleteWorkflowTask"
                  btnStyle="danger"
                  buttonIcon="trash"
                  message="Delete a workflow task {selectedWorkflowTask.task.name}"
                  callbackAction={handleDeleteWorkflowTask.bind(this, workflow.id, selectedWorkflowTask.id)}
                ></ConfirmActionButton>
              </div>
              <ul class="nav nav-tabs card-header-tabs">
                <li class="nav-item">
                  <a data-bs-toggle="tab" data-bs-target="#args-tab" class="nav-link {workflowTabContextId === 0 ? 'active' : ''}" aria-current="true" href="#" >Arguments</a>
                </li>
                <li class="nav-item">
                  <a data-bs-toggle="tab" data-bs-target="#meta-tab" class="nav-link {workflowTabContextId === 1 ? 'active' : ''}" href="#" >Meta</a>
                </li>
                <li class="nav-item">
                  <a  class="nav-link disabled">Info</a>
                </li>
              </ul>
            {:else}
              Select a workflow task from the list
            {/if}
          </div>
          <div class="tab-content">
            <div id="args-tab" class="tab-pane show active">
              <div class="card-body">
                {#if selectedWorkflowTask}
                  {#key selectedWorkflowTask}
                    <ArgumentForm workflowId={workflow.id} workflowTaskId={selectedWorkflowTask.id} workflowTaskArgs={selectedWorkflowTask.args}></ArgumentForm>
                  {/key}
                {/if}
              </div>
            </div>
            <div id="meta-tab" class="tab-pane">
              <div class="card-body">
                {#if selectedWorkflowTask}
                  {#key selectedWorkflowTask}
                    <MetaPropertiesForm workflowId={workflow.id} taskId={selectedWorkflowTask.id} metaProperties={selectedWorkflowTask.meta}></MetaPropertiesForm>
                  {/key}
                {/if}
              </div>
            </div>
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

<div class="modal" id="editWorkflowModal">

  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Workflow properties</h5>
        <button class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">

        {#if workflow}
        <form id="updateWorkflow" method="post" use:enhance={handleWorkflowUpdate}>

          <div class="mb-3">
            <label for="workflowName" class="form-label">Workflow name</label>
            <input type="text" class="form-control" name="workflowName" id="workflowName" value="{workflow.name}">
          </div>

        </form>
        {/if}

      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" form="updateWorkflow">Save</button>
      </div>
    </div>
  </div>

</div>

<div class="modal" id="editWorkflowTasksOrderModal">

  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Edit workflow tasks order</h5>
        <button class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">

        {#if workflow != undefined && updatableWorkflowList.length == 0 }
          <p class="text-center mt-3">No workflow tasks yet, add one.</p>
        {:else if workflow != undefined}
          <ul class="list-group list-group-flush">
            {#each updatableWorkflowList as workflowTask, i }
              <li class="list-group-item" data-fs-target={workflowTask.id}>
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    {workflowTask.task.name} #{workflowTask.id}
                  </div>
                  <div>
                    <button class="btn btn-light" on:click|preventDefault={moveWorkflowTask.bind(this, i, 'up')}><i class="bi-arrow-up"></i></button>
                    <button class="btn btn-light" on:click|preventDefault={moveWorkflowTask.bind(this, i, 'down')}><i class="bi-arrow-down"></i></button>
                  </div>
                </div>
              </li>
            {/each}
          </ul>
        {/if}

      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" on:click|preventDefault={handleWorkflowOrderUpdate}>Save</button>
      </div>
    </div>
  </div>

</div>

<div class="modal" id="runWorkflowModal">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Run workflow</h5>
        <button class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <div id="applyWorkflowError"></div>
        <form id="runWorkflowForm" method="post" use:enhance={handleApplyWorkflow}>
          <div class="mb-3">
            <label for="inputDataset" class="form-label">Input dataset</label>
            <select name="inputDataset" id="inputDataset" class="form-control">
              <option value="">Select an input dataset</option>
              {#each datasets as dataset}
                <option value="{dataset.id}">{dataset.name}</option>
              {/each}
            </select>
          </div>
          <div class="mb-3">
            <label for="outputDataset" class="form-label">Output dataset</label>
            <select name="outputDataset" id="outputDataset" class="form-control">
              <option value="">Select an output dataset</option>
              {#each datasets as dataset}
                <option value="{dataset.id}">{dataset.name}</option>
              {/each}
            </select>
          </div>
          <div class="mb-3">
            <label for="workerInit" class="form-label">Input data</label>
            <textarea name="workerInit" id="workerInit" class="form-control font-monospace" rows="5"></textarea>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" form="runWorkflowForm">Run</button>
      </div>
    </div>
  </div>
</div>