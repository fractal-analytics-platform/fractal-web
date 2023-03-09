<script>

  import { enhance } from '$app/forms'
  import { goto } from '$app/navigation'
  import { createWorkflow } from '$lib/api/v1/workflow/workflow_api'

  // The list of workflows
  export let workflows = []
  // Set the projectId prop to reference a specific project for each workflow
  export let projectId = undefined
  // Control whether the user can send or not the form
  let enableCreateWorflow = false

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
      })
  }

  function handleWorkflowNameChange(event) {
    const inputValue = event.target?.value || undefined
    if (inputValue !== undefined && inputValue !== '') {
      enableCreateWorflow = true
    } else {
      enableCreateWorflow = false
    }
  }

</script>

<div class="container p-0 mt-4">
  <p class="lead">Workflows</p>
  <table class="table align-middle caption-top">
    <caption class="text-bg-light border-top border-bottom pe-3 ps-3">
      <div class="d-flex align-items-center justify-content-end">
        <span class="fw-normal"></span>
        <div>
          <form method='post' class="row row-cols-lg-auto g-3 align-items-center" use:enhance={handleCreateWorkflow}>
            <div class="col-12">
              <div class="input-group">
                <div class="input-group-text">Name</div>
                <input type="text" class="form-control" placeholder="workflow name" name="workflowName" on:change={handleWorkflowNameChange}>
              </div>
            </div>
            <button class="btn btn-primary" disabled={!enableCreateWorflow} type="submit">
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
          <td></td>
        </tr>
      {/each}
    </tbody>
  </table>

</div>