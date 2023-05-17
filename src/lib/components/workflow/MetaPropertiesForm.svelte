<script>
  // This component handles the meta properties of a workflow task.
  // Every time the workflow task meta properties are updated within the form, this component should update the server
  // If the server successfully stores the updated meta properties
  // then the status between the client and server is in sync
  //
  // This component also manages the overall form structure of meta properties.
  // The form should be structured in multiple levels of depth, and support complex structure.
  import { page } from '$app/stores'
  import { updateFormEntry } from '$lib/components/workflow/task_form_utils'
  import FormBuilder from '$lib/components/workflow/common/FormBuilder.svelte'

  // Workflow id
  export let workflowId
  // Workflow task id
  export let taskId
  // Workflow task meta properties
  export let metaProperties = {}

  if (metaProperties == null || metaProperties === undefined) {
    metaProperties = {}
  }

  async function handleEntryUpdate(updatedEntry) {
		const projectId = $page.params.projectId
    try {
      const updatedMetaProperties = await updateFormEntry(projectId, workflowId, taskId, updatedEntry, 'meta')
      metaProperties = updatedMetaProperties.meta
    } catch (error) {
      console.log(error)
    }
  }

</script>

<div>
  <FormBuilder entry={metaProperties} updateEntry={handleEntryUpdate}></FormBuilder>
</div>
