<script>
  import { onMount } from 'svelte'
  import { writable } from 'svelte/store'
  import { enhance } from '$app/forms'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { listTasks } from '$lib/api/v1/task/task_api'
  import ArgumentForm from '$lib/components/workflow/ArgumentForm.svelte'
  import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte'
  import StandardErrorAlert from '$lib/components/common/StandardErrorAlert.svelte'
  import MetaPropertiesForm from '$lib/components/workflow/MetaPropertiesForm.svelte'

  // Workflow
  let workflow = undefined
  // Project context properties
  let project = undefined
  let datasets = []
  // List of available tasks to be inserted into workflow
  let availableTasks = []

  let workflowTaskContext = writable(undefined)
  let workflowTabContextId = 0
  let workflowUpdated = false
  let workflowTaskCreated = false
  let selectedWorkflowTask = undefined
  let checkingConfiguration = false
  let inputDatasetControl = ''
  let outputDatasetControl = ''
  let workerInitControl = ''

  $: updatableWorkflowList = workflow?.task_list || []

  workflowTaskContext.subscribe((value) => {
    selectedWorkflowTask = value
  })

  onMount(async () => {
    workflow = $page.data.workflow
    project = $page.data.project
    datasets = $page.data.datasets
  })

  async function handleExportWorkflow(event) {

    const response = await fetch(`/projects/${project.id}/workflows/${workflow.id}/export`, {
      method: 'GET',
      credentials: 'include'
    })

    if (!response.ok) {
      console.error(await response.json())
      return
    }

		const workflowData = await response.json()

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

  async function handleWorkflowUpdate() {
    return async ({ result }) => {
      if (result.type !== 'failure') {
        const updatedWorkflow = result.data
        workflow = updatedWorkflow
        workflowUpdated = true
        setTimeout(() => {
          workflowUpdated = false
        }, 3000)
      } else {
        console.error('Error updating workflow properties', result.data)
      }
    }
  }

  async function handleCreateWorkflowTask({ form }) {
    return async ({ result }) => {
      if (result.type !== 'failure') {
        // Workflow task created
        console.log('Workflow task created')
        // Update workflow
        workflow = result.data
        // UI Feedback
        workflowTaskCreated = true
        setTimeout(() => {
          workflowTaskCreated = false
        }, 3000)
        form.reset()
      } else {
        console.error('Error creating new workflow task', result.data)
      }
    }
  }

  async function handleDeleteWorkflowTask(workflowId, workflowTaskId) {
    const response = await fetch(`/projects/${project.id}/workflows/${workflowId}/task/${workflowTaskId}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    if (response.ok) {
      // Successfully deleted task
      workflow = await response.json()
      workflowTaskContext.set(undefined)
    } else {
      console.error(response)
    }
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

    const requestData = {
			tasksOrder: updatableWorkflowList.map(t => t.id)
    }

    // Patch workflow task order
    const request = await fetch(`/projects/${project.id}/workflows/${workflow.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })

    if (request.ok) {
			console.log('Workflow task order updated')
      // Successfully updated workflow task order
      workflow = await request.json()
      const modal = bootstrap.Modal.getInstance(document.getElementById('editWorkflowTasksOrderModal'))
      modal.toggle()
    } else {
      console.error('Workflow task order not updated', request.statusText)
    }
  }

  async function handleApplyWorkflow() {
    // Build a FormData object
    const data = new FormData()
    data.append('inputDataset', inputDatasetControl)
    data.append('outputDataset', outputDatasetControl)
    data.append('workerInit', workerInitControl)

    const response = await fetch(`/projects/${project.id}/workflows/${workflow.id}/apply`, {
      method: 'POST',
      credentials: 'include',
      body: data
    })

    if (response.ok) {
      // Successfully applied workflow
      const job = await response.json()
      const modal = bootstrap.Modal.getInstance(document.getElementById('runWorkflowModal'))
      modal.toggle()
      // Navigate to project jobs page
      // Define URL to navigate to
      const jobsUrl = new URL(`/projects/${project.id}/jobs`, window.location.origin)
      // Set jobsUrl search params
      jobsUrl.searchParams.set('workflow', workflow.id)
      jobsUrl.searchParams.set('id', job.id)
      // Trigger navigation
      goto(jobsUrl)
    } else {
      console.error(response)
      // Set an error message on the component
      new StandardErrorAlert({
        target: document.getElementById('applyWorkflowError'),
        props: {
          error: await response.json()
        }
      })
    }

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
          <a href="/projects/{$page.params.id}">{project?.name}</a>
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
    <a href="/projects/{project?.id}/jobs?workflow={workflow?.id}" class="btn btn-light"><i class="bi-journal-code"></i> List jobs</a>
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
        <form method="post" action="?/createWorkflowTask" use:enhance={handleCreateWorkflowTask}>

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
      <div class="modal-footer d-flex">
        {#if workflowTaskCreated}
          <span class="w-100 alert alert-success">Workflow task created</span>
        {/if}
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
        <form id="updateWorkflow" method="post" action="?/updateWorkflow" use:enhance={handleWorkflowUpdate}>

          <div class="mb-3">
            <label for="workflowName" class="form-label">Workflow name</label>
            <input type="text" class="form-control" name="workflowName" id="workflowName" value="{workflow.name}">
          </div>

        </form>
        {/if}

      </div>
      <div class="modal-footer">
        {#if workflowUpdated }
          <span class="alert alert-success">Workflow updated correctly</span>
        {/if}
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

        {#if workflow !== undefined && updatableWorkflowList.length == 0 }
          <p class="text-center mt-3">No workflow tasks yet, add one.</p>
        {:else if workflow !== undefined}
          {#key updatableWorkflowList }
            <ul class="list-group list-group-flush">
              {#each updatableWorkflowList as workflowTask, i }
                <li class="list-group-item" data-fs-target={workflowTask.id}>
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      {workflowTask.task.name} #{workflowTask.id}
                    </div>
                    <div>
                      {#if i !== 0 }
                        <button class="btn btn-light" on:click|preventDefault={moveWorkflowTask.bind(this, i, 'up')}><i class="bi-arrow-up"></i></button>
                      {/if}
                      {#if i !== updatableWorkflowList.length - 1 }
                        <button class="btn btn-light" on:click|preventDefault={moveWorkflowTask.bind(this, i, 'down')}><i class="bi-arrow-down"></i></button>
                      {/if}
                    </div>
                  </div>
                </li>
              {/each}
            </ul>
          {/key}
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
        <form id="runWorkflowForm">
          <div class="mb-3">
            <label for="inputDataset" class="form-label">Input dataset</label>
            <select name="inputDataset" id="inputDataset" class="form-control" disabled={checkingConfiguration} bind:value={inputDatasetControl}>
              <option value="">Select an input dataset</option>
              {#each datasets as dataset}
                <option value="{dataset.id}">{dataset.name}</option>
              {/each}
            </select>
          </div>
          <div class="mb-3">
            <label for="outputDataset" class="form-label">Output dataset</label>
            <select name="outputDataset" id="outputDataset" class="form-control" disabled={checkingConfiguration} bind:value={outputDatasetControl}>
              <option value="">Select an output dataset</option>
              {#each datasets as dataset}
                <option value="{dataset.id}">{dataset.name}</option>
              {/each}
            </select>
          </div>
          <div class="mb-3">
            <label for="workerInit" class="form-label">Worker initialization (Optional)</label>
            <textarea name="workerInit" id="workerInit" class="form-control font-monospace" rows="5" disabled={checkingConfiguration} bind:value={workerInitControl}></textarea>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        {#if checkingConfiguration }
          <button class="btn btn-warning" on:click={() => {
            checkingConfiguration = false
          }}>Cancel</button>
          <button class="btn btn-primary" on:click|preventDefault={handleApplyWorkflow}>Confirm</button>
        {:else}
          <button class="btn btn-primary" on:click={() => {
            checkingConfiguration = true
          }}>Run</button>
        {/if}
      </div>
    </div>
  </div>
</div>