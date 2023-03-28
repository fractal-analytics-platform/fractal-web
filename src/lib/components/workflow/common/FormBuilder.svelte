<script>
  import FormStructure from './FormStructure.svelte'
  import NewEntryProperty from "./NewEntryProperty.svelte";

  export let entry

  let newEntryProperty = false

</script>

<div>
  <FormStructure {entry}></FormStructure>

  <NewEntryProperty {entry} activateInput={newEntryProperty}></NewEntryProperty>

  <div class="d-flex justify-content-center align-items-center mt-3">
    <button class="btn btn-secondary" on:click={() => newEntryProperty = true}>Add property <i class="text-bi-plus-square-fill"></i></button>
  </div>
</div>