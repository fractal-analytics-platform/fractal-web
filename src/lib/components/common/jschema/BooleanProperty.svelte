<script>
	import { getContext } from 'svelte';

	const schemaManager = getContext('schemaManager');

	export let schemaProperty = undefined;

	function handleValueChange() {
		schemaManager.updateValue(schemaProperty.key, schemaProperty.value);
	}

</script>

{#if schemaProperty}
  <div style='background-color: deepskyblue' class='d-flex align-items-center p-2'>
    <div class='property-metadata d-flex flex-column align-self-center w-50'>
      <span class='fs-4'>{ schemaProperty.title }</span>
      <span>{ schemaProperty.description }</span>
    </div>
    <div class='property-input ms-auto w-25'>
      <div class='form-check'>
        <input id='property-{schemaProperty.key}' type='checkbox' bind:checked={schemaProperty.value}
               on:change={handleValueChange} class='form-check-input'>
        <label class='form-check-label' for='property-{schemaProperty.key}'>
          { schemaProperty.value }
        </label>
      </div>
    </div>
  </div>
{/if}