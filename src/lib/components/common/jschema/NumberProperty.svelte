<script>

	export let propertyKey = undefined;
	export let propertyValue = undefined;
	export let defaultValue = null;

	if (propertyValue === undefined) {
		propertyValue = defaultValue;
	}

</script>

<div style='background-color: red'>
  <p>Number property {propertyKey}</p>

  <input type='number' bind:value={propertyValue}>

</div>