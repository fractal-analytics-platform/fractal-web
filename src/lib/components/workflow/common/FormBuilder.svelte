<script>
  import FormStructure from './FormStructure.svelte'
  import NewEntryProperty from "./NewEntryProperty.svelte";

  export let entry

  if (entry == null || entry === undefined) {
    entry = {}
  }

  const submitNewEntry = (newEntry) => {
    updateEntry(newEntry)
  }

  export let updateEntry

  function handleEntryUpdateEvent(event) {
    updateEntry(event.detail.value)
  }

  function handleEntryInserted(event) {
    updateEntry(event.detail)
  }

</script>

{#key entry}
  <div>
    <FormStructure {entry} on:entryUpdated={handleEntryUpdateEvent} on:entryInserted={handleEntryInserted}></FormStructure>
    <NewEntryProperty {entry} {submitNewEntry}></NewEntryProperty>
  </div>
{/key}