<script>
  import FormStructure from './FormStructure.svelte'
  import NewEntryProperty from "./NewEntryProperty.svelte";

  export let entry

  const submitNewEntry = (newEntry) => {
    entry = newEntry
  }

  $: {
    console.log(entry)
  }

</script>

<div>
  <FormStructure {entry} on:entryUpdated={(event) => console.log(event.detail.value)}></FormStructure>
  <NewEntryProperty {entry} {submitNewEntry}></NewEntryProperty>
</div>