<script>
	import { getContext } from 'svelte';
	import PropertyDiscriminator from '$lib/components/common/jschema/PropertyDiscriminator.svelte';

	const context = getContext('jsonSchema');

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

	context.setDefaultValue(arraySchema.key, values);

	function getNestedArraySchema(index) {
		const arrayItemSchema = {
			key: arraySchema.key.concat('###', index),
			items: arraySchema.items?.items,
			type: arraySchema.items?.type,
			$ref: arraySchema.items?.$ref,
			value: values[index]
		};
		return arrayItemSchema;
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
        <PropertyDiscriminator propertyData={getNestedArraySchema(index)}
                               propertyValue={propertyValue}></PropertyDiscriminator>
      {/each}
    {/if}
  </div>

{:else}

  <div>
    <p>Unable to display array data</p>
  </div>


{/if}