<script>
  import { page } from '$app/stores'
  import { updateFormEntry } from '$lib/components/workflow/task_form_utils'
  import FormBuilder from '$lib/components/workflow/common/FormBuilder.svelte';

  // This component shall handle a form which the user can use to specify arguments of a workflow-task
  // Upon interacting with this component, a representation of the arguments to be used with a workflow task
  // shall be kept in memory with a key-value object.
  // This component shall permit to:
  // - insert a sequence of key-value-type items
  // - store the sequence in a coherent object
  // - enable the usage of the object that keeps the representation of the list

  export let workflowId = undefined
  export let workflowTaskId = undefined

  // The main property managed by this component
  export let workflowTaskArgs = {}

  if (workflowTaskArgs == null || workflowTaskArgs === undefined) {
    workflowTaskArgs = {}
  }

  async function handleEntryUpdate(updatedEntry) {
    const projectId = $page.params.projectId
    try {
      const response = await updateFormEntry(projectId, workflowId, workflowTaskId, updatedEntry, 'args')
      workflowTaskArgs = response.args
    } catch (error) {
      console.error(error)
    }
  }

</script>

<div>
  <FormBuilder entry={workflowTaskArgs} updateEntry={handleEntryUpdate}></FormBuilder>
</div>