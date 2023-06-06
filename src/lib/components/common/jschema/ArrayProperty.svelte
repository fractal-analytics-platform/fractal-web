<script>

	import PropertyDiscriminator from '$lib/components/common/jschema/PropertyDiscriminator.svelte';

	export let arraySchema = undefined;
	let values = undefined;


	if (arraySchema.value === undefined) {
		if (arraySchema.default !== undefined) {
			values = arraySchema.default;
		} else {
			values = [];
		}
	} else {
		values = arraySchema.value;
	}

	function getNestedArraySchema(index) {
		return {
			key: arraySchema.key,
			items: arraySchema.items?.items,
			type: arraySchema.items?.type,
			value: values[index]
		};
	}

	function addValue() {
		values.push(undefined);
		values = values;
	}

</script>

{#if arraySchema || arraySchema.items !== undefined}

  <div style='background-color: rosybrown'>
    <p>Array property</p>
    <button class='btn btn-primary' on:click={addValue}>Add</button>

    {#if values}
      {#each values as propertyValue, index}
        <p style='background-color: black; color: white'>{propertyValue}</p>
        <PropertyDiscriminator propertyData={getNestedArraySchema(index)}></PropertyDiscriminator>
      {/each}
    {/if}
  </div>

{:else}

  <div>
    <p>Unable to display array data</p>
  </div>


{/if}