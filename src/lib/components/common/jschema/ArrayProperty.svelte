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

	console.log('Array schema', arraySchema);
	console.log('Array schema type', arraySchema.items?.type);
	console.log(arraySchema.key, arraySchema.value, arraySchema.default);
	console.log(values);

	function getNestedArraySchema(index) {
		return {
			key: arraySchema.key,
			items: arraySchema.items?.items,
			type: arraySchema.items?.type,
			value: values[index]
		};
	}

</script>

{#if arraySchema || arraySchema.items !== undefined}

  <div style='background-color: rosybrown'>
    <p>Array property</p>

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