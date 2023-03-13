<script>

  import { enhance } from '$app/forms'
  import { goto } from '$app/navigation'
  import { createWorkflow, deleteWorkflow } from '$lib/api/v1/workflow/workflow_api'
  import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte'
  import StandardErrorAlert from '$lib/components/common/StandardErrorAlert.svelte'

  // The list of workflows
  export let workflows = []
  // Set the projectId prop to reference a specific project for each workflow
  export let projectId = undefined
  // Control whether the user can send or not the form
  let enableCreateWorkflow = false
  let validationError = false

  async function handleCreateWorkflow({ form, cancel, data }) {
    // Prevent default
    cancel()

    // Set the form data projectId to the referenced project id
    data.set('projectId', projectId)

    await createWorkflow(data)
      .then(workflow => {
        console.log(workflow)
        form.reset()
        goto(`/projects/${projectId}/workflows/${workflow.id}`)
      })
      .catch(error => {
        console.error(error)
        validationError = true
        new StandardErrorAlert({
          target: document.getElementById('workflowCreateAlertError'),
          props: {
            error
          }
        })
      })
  }

  async function handleDeleteWorkflow(workflowId) {
    await deleteWorkflow(workflowId)
      .then(() => {
        // Workflow has been deleted
        workflows = workflows.filter((wkf) => {
          return wkf.id !== workflowId
        })
      })
      .catch(error => {
        // Instantiate a new standard error alert
        new StandardErrorAlert({
          target: document.getElementById('workflowDeleteAlertError'),
          props: {
            error: error.message
          }
        })
      })
  }

  function handleWorkflowNameChange(event) {
    const inputValue = event.target?.value || undefined
    if (inputValue !== undefined && inputValue !== '') {
      enableCreateWorkflow = true
    } else {
      enableCreateWorkflow = false
    }
  }

</script>

<div class="container p-0 mt-4">
  <p class="lead">Workflows</p>
  <div id="workflowCreateAlertError"></div>
  <div id="workflowDeleteAlertError"></div>
  <table class="table align-middle caption-top">
    <caption class="text-bg-light border-top border-bottom pe-3 ps-3">
      <div class="d-flex align-items-center justify-content-end">
        <span class="fw-normal"></span>
        <div>
          <form method='post' class="row row-cols-lg-auto g-3 align-items-center" use:enhance={handleCreateWorkflow}>
            <div class="col-12">
              <div class="input-group">
                <div class="input-group-text">Name</div>
                <input type="text" class="form-control {validationError ? 'is-invalid' : ''}" placeholder="workflow name" name="workflowName" on:change={handleWorkflowNameChange}>
              </div>
            </div>
            <button class="btn btn-primary" disabled={!enableCreateWorkflow} type="submit">
              Create workflow
              <i class="bi bi-node-plus-fill"></i>
            </button>
          </form>
        </div>
      </div>
    </caption>
    <thead class="table-light">
      <tr>
        <th class="col-4">Id</th>
        <th class="col-4">Name</th>
        <th>Options</th>
      </tr>
    </thead>
    <tbody>
      {#each workflows as { id, name }}
        <tr>
          <td>{id}</td>
          <td>{name}</td>
          <td>
            <ConfirmActionButton
              modalId={"deleteConfirmModal" + id}
              style={'danger'}
              label={'Delete'}
              callbackAction={handleDeleteWorkflow.bind(this, id)}>
            </ConfirmActionButton>
            <a href="/projects/{projectId}/workflows/{id}" class="btn btn-light">
              Open
              <i class="bi bi-arrow-up-right-square"></i>
            </a>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>

</div>