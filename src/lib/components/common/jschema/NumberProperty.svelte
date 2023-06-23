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
  <div class='d-flex align-items-center p-2'>
    <div class='property-metadata d-flex flex-column align-self-center w-50'>
      <span
        class='fs-5 {schemaProperty.isRequired() ? "fw-bold" : ""}'>{ schemaProperty.title || 'Number argument' }</span>
      {#if schemaProperty.description }
        <span class='small'>{ schemaProperty.description }</span>
      {/if}
    </div>
    <div class='property-input ms-auto w-25'>
      <input type='number' bind:value={schemaProperty.value} on:change={handleValueChange} class='form-control'>
    </div>
  </div>
{/if}