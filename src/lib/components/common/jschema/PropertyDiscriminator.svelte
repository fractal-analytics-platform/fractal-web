<script>
	import { onMount, getContext } from 'svelte';
	import { resolveSchemaReference } from '$lib/components/common/jschema/utils.js';

	import NumberProperty from '$lib/components/common/jschema/NumberProperty.svelte';
	import StringProperty from '$lib/components/common/jschema/StringProperty.svelte';
	import BooleanProperty from '$lib/components/common/jschema/BooleanProperty.svelte';
	import ArrayProperty from '$lib/components/common/jschema/ArrayProperty.svelte';
	import ObjectProperty from '$lib/components/common/jschema/ObjectProperty.svelte';

	export let propertyData = undefined;

	const context = getContext('jsonSchema');

	onMount(() => {
		// Discriminate the property if required
		if (propertyData && propertyData.type === undefined) {
			// The propertyData.type should not be undefined
			if (propertyData.$ref !== undefined) {
				const resolvedSchema = resolveSchemaReference(propertyData.$ref, context.getSchema());
				console.log('Resolving reference', resolvedSchema);
				// Intersect the resolved schema with the propertyData
				propertyData = { ...propertyData, ...resolvedSchema };
			}

		}
	});

</script>

{#if propertyData && propertyData.type }

  <div>
    {#if propertyData.type === 'integer'}
      <NumberProperty></NumberProperty>
    {/if}
    {#if propertyData.type === 'string'}
      <StringProperty></StringProperty>
    {/if}
    {#if propertyData.type === 'boolean'}
      <BooleanProperty></BooleanProperty>
    {/if}
    {#if propertyData.type === 'array'}
      <ArrayProperty arraySchema={propertyData}></ArrayProperty>
    {/if}
    {#if propertyData.type === 'object'}
      <ObjectProperty objectSchema={propertyData}></ObjectProperty>
    {/if}
  </div>

{:else}

  <div>
    <p>Unable to display schema property | unknown property type</p>
  </div>

{/if}