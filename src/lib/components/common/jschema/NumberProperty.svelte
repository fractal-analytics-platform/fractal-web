<script>
	import { getContext } from 'svelte';

	const context = getContext('jsonSchema');

	export let propertyKey = undefined;
	export let propertyValue = undefined;
	export let defaultValue = null;

	if (propertyValue === undefined) {
		propertyValue = defaultValue;
	}

	context.setDefaultValue(propertyKey, propertyValue);

	function handleValueChange() {
		context.updateValue(propertyKey, propertyValue);
	}

</script>

<div style='background-color: red'>
  <p>Number property</p>

  <input type='number' bind:value={propertyValue} on:change={handleValueChange}>

</div>