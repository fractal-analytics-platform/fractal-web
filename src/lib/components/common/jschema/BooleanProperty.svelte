<script>
	import { getContext } from 'svelte';

	const schemaManager = getContext('schemaManager');

	export let propertyKey = undefined;
	export let propertyValue = undefined;
	export let defaultValue = null;

	if (propertyValue === undefined) {
		propertyValue = defaultValue;
	}

	schemaManager.setDefaultValue(propertyKey, propertyValue);

	function handleValueChange() {
		schemaManager.updateValue(propertyKey, propertyValue);
	}
</script>

<div style='background-color: deepskyblue'>
  <p>Boolean property</p>

  <input type='checkbox' bind:checked={propertyValue} on:change={handleValueChange}>
</div>