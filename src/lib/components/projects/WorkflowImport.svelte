<script>
  import { createEventDispatcher } from 'svelte'
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import { importWorkflow } from '$lib/api/v1/project/project_api'
  import StandardErrorAlert from '$lib/components/common/StandardErrorAlert.svelte'

  const dispatch = createEventDispatcher()

  // Component properties
  const projectId = $page.params.id
  let importing = false
  let importSuccess = undefined

  async function handleWorkflowImportForm({ form, data, cancel }) {
    // Prevent default
    cancel()

    const workflowFile = data.get('workflowFile')
    console.log(workflowFile)

    if (workflowFile.name == '') {
      throw new Error('No workflow file specified')
    }

    const workflowMetadata = await workflowFile.text().then(data => JSON.parse(data))
    console.log(workflowMetadata)

    // Request workflow import
    importing = true
    await importWorkflow(projectId, workflowMetadata)
      .then(importedWorkflow => {
        importing = false
        importSuccess = true
        setTimeout(() => {
          importSuccess = false
        }, 3000)
        dispatch('workflowImported', importedWorkflow)
        form.reset()
      })
      .catch(error => {
        importing = false
        new StandardErrorAlert({
          target: document.getElementById('importWorkflowError'),
          props: {
            error
          }
        })
      })

  }

</script>

<div id="importWorkflowError"></div>

<form method="post" use:enhance={handleWorkflowImportForm}>

  <div class="mb-3">
    <label for="workflowFile" class="form-label">Select a workflow file</label>
    <input class="form-control" type="file" name="workflowFile" id="workflowFile">
  </div>

  <button class="btn btn-primary" disabled={importing}>
    {#if importing}
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
    {/if}
    Import
  </button>
</form>

{#if importSuccess}
  <p class="alert alert-primary mt-3">Workflow imported successfully</p>
{/if}