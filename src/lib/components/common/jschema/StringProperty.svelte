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

<div style='background-color: lawngreen'>
  <p>String property</p>

  <input type='text' bind:value={propertyValue} on:change={handleValueChange}>
</div>