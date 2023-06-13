<script>
	import { onMount, getContext } from 'svelte';
	import PropertyDiscriminator from '$lib/components/common/jschema/PropertyDiscriminator.svelte';

	export let properties = undefined;
	export let blockKey = undefined;
	let parsedProperties = undefined;

	const schemaManager = getContext('schemaManager');

	onMount(() => {
		// Make properties object into an array
		parsedProperties = Object.keys(properties).map(key => {
			const props = { ...properties[key] };
			// If blockKey is undefined, set it to the key
			if (blockKey === undefined) props.key = key;
			// If blockKey is defined, set it to the blockKey
			else props.key = blockKey + '###' + key;
			return props;
		});
	});


</script>

<div class='d-flex flex-column properties-block'>
  {#if parsedProperties}
    {#each parsedProperties as prop}
      <PropertyDiscriminator schemaProperty={schemaManager.addProperty(prop)}></PropertyDiscriminator>
    {/each}
  {/if}
</div>