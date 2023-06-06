<script>

	export let propertyKey = undefined;
	export let propertyValue = undefined;
	export let defaultValue = null;

	if (propertyValue === undefined) {
		propertyValue = defaultValue;
	}
</script>

<div style='background-color: deepskyblue'>
  <p>Boolean property</p>

  <input type='checkbox' bind:checked={propertyValue}>
</div>