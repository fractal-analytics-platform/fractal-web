<script>
	import { onMount, getContext } from 'svelte';
	import PropertyDiscriminator from '$lib/components/common/jschema/PropertyDiscriminator.svelte';
	import { mapSchemaProperties } from '$lib/components/common/jschema/schema_management.js';

	export let properties = undefined;
	export let blockKey = undefined;
	let parsedProperties = undefined;

	const schemaManager = getContext('schemaManager');

	onMount(() => {
		// Make properties object into an array
		parsedProperties = mapSchemaProperties(properties, blockKey);
	});


</script>

<div class='d-flex flex-column properties-block'>
  {#if parsedProperties}
    {#each parsedProperties as prop}
      <PropertyDiscriminator schemaProperty={schemaManager.addProperty(prop)}></PropertyDiscriminator>
    {/each}
  {/if}
</div>