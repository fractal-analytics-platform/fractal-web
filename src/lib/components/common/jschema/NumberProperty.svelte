<script>
	import { getContext } from 'svelte';

	const context = getContext('jsonSchema');

	export let propertyKey = undefined;
	export let propertyValue = undefined;
	export let defaultValue = null;

	let hasChanged = false;

	if (propertyValue === undefined) {
		propertyValue = defaultValue;
	}

	context.setDefaultValue(propertyKey, propertyValue);

	function handleValueChange() {
		context.updateValue(propertyKey, propertyValue);
		hasChanged = true;
	}

</script>

<div style='background-color: red' class='{hasChanged ? "border border-primary" : ""}'>
  <p>Number property</p>

  <input type='number' bind:value={propertyValue} on:change={handleValueChange}>

</div>