<script>

	export let propertyKey = undefined;
	export let propertyValue = undefined;
	export let defaultValue = null;

	if (propertyValue === undefined) {
		propertyValue = defaultValue;
	}

</script>

<div style='background-color: lawngreen'>
  <p>String property {propertyKey}</p>

  <input type='text' bind:value={propertyValue}>
</div>