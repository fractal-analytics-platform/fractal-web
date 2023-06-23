<script>
	import { getContext } from 'svelte';

	const schemaManager = getContext('schemaManager');

	export let schemaProperty = undefined;

	let hasChanged = false;

	function handleValueChange() {
		schemaManager.updateValue(schemaProperty.key, schemaProperty.value);
		hasChanged = true;
	}

</script>

{#if schemaProperty }
  <div style='background-color: red' class='d-flex align-items-center p-2'>
    <div class='property-metadata d-flex flex-column align-self-center w-50'>
      <span class='fs-4 {schemaProperty.isRequired() ? "fw-bold" : ""}'>{ schemaProperty.title }</span>
      <span>{ schemaProperty.description }</span>
    </div>
    <div class='property-input ms-auto w-25'>
      <input type='number' bind:value={schemaProperty.value} on:change={handleValueChange} class='form-control'>
    </div>
  </div>
{/if}