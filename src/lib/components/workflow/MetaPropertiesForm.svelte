<script>
  // This component handles the meta properties of a workflow task.
  // Every time the workflow task meta properties are updated within the form, this component should update the server
  // If the server successfully stores the updated meta properties
  // then the status between the client and server is in sync
  //
  // This component also manages the overall form structure of meta properties.
  // The form should be structured in multiple levels of depth, and support complex structure.
  import FormBuilder from '$lib/components/workflow/common/FormBuilder.svelte'

  export let metaProperties = {}

  $: {
    console.log(metaProperties)
  }

  function handlePropertyUpdate(event) {
    console.log(event.detail)
    console.log(metaProperties)
    // metaProperties[event.detail.name] = event.detail.value
  }

</script>

<div>
  <FormBuilder entry={metaProperties} on:entryUpdated={handlePropertyUpdate}></FormBuilder>
</div>
