<script>
	import { onMount, getContext } from 'svelte';
	import PropertyDiscriminator from '$lib/components/common/jschema/PropertyDiscriminator.svelte';
	import { mapSchemaProperties } from '$lib/components/common/jschema/schema_management.js';

	const schemaManager = getContext('schemaManager');

	export let properties = undefined;
	export let blockKey = undefined;
	export let removePropertyBlock = undefined;

	let parsedProperties = undefined;
	let blockProperties = [];

	onMount(() => {
		// Make properties object into an array
		parsedProperties = mapSchemaProperties(properties, blockKey);
		parsedProperties.forEach((prop) => {
			blockProperties.push(schemaManager.addProperty(prop));
		});
	});

</script>

<div class='d-flex flex-column properties-block'>
  {#if parsedProperties}
    {#each blockProperties as prop}
      {#if removePropertyBlock }
        <button class='btn btn-danger' type="button" on:click={() => removePropertyBlock(prop.key)}>Remove Property Block
        </button>
      {/if}
      <PropertyDiscriminator schemaProperty={prop}></PropertyDiscriminator>
    {/each}
  {/if}
</div>