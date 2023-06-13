<script>
	import { getContext } from 'svelte';

	const schemaManager = getContext('schemaManager');

	export let schemaProperty = undefined;

	function handleValueChange() {
		schemaManager.updateValue(schemaProperty.key, schemaProperty.value);
	}

</script>

<div style='background-color: deepskyblue'>
  <p>Boolean property</p>

  <input type='checkbox' bind:checked={schemaProperty.value} on:change={handleValueChange}>
</div>