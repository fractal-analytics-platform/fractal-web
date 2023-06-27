<script>
	import { getContext } from 'svelte';
	import PropertyDescription from '$lib/components/common/jschema/PropertyDescription.svelte';

	const schemaManager = getContext('schemaManager');

	export let schemaProperty = undefined;

	function handleValueChange() {
		schemaManager.updateValue(schemaProperty.key, schemaProperty.value);
	}

</script>

{#if schemaProperty }
  <div class='d-flex align-items-center p-2'>
    <div class='property-metadata d-flex flex-row align-self-center w-50'>
      <span
        class='{schemaProperty.isRequired() ? "fw-bold" : ""}'>{ schemaProperty.title || 'String argument' }</span>
      <PropertyDescription description={schemaProperty.description} />
    </div>
    <div class='property-input ms-auto w-50'>
      <input type='text' bind:value={schemaProperty.value} on:change={handleValueChange} class='form-control'>
    </div>
  </div>
{/if}