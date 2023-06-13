<script>
	import { getContext } from 'svelte';

	const schemaManager = getContext('schemaManager');

	export let schemaProperty = undefined;

	schemaManager.setDefaultValue(schemaProperty.key, schemaProperty.value);

	function handleValueChange() {
		schemaManager.updateValue(schemaProperty.key, schemaProperty.value);
	}

</script>

{#if schemaProperty }
  <div style='background-color: lawngreen'>
    <p>String property</p>

    <input type='text' bind:value={schemaProperty.value} on:change={handleValueChange}>
  </div>
{/if}