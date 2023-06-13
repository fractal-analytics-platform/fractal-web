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
  <div style='background-color: red' class='{hasChanged ? "border border-primary" : ""}'>
    <p>Number property</p>

    <input type='number' bind:value={schemaProperty.value} on:change={handleValueChange}>

  </div>
{/if}