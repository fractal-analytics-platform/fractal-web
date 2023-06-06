<script>
	import { onMount, getContext } from 'svelte';
	import PropertyDiscriminator from '$lib/components/common/jschema/PropertyDiscriminator.svelte';

	export let properties = undefined;
	export let blockKey = undefined;
	let parsedProperties = undefined;

	const context = getContext('jsonSchema');

	console.log(context.getSchema());

	onMount(() => {
		// Make properties object into an array
		parsedProperties = Object.keys(properties).map(key => {
			const props = { ...properties[key] };
			// If blockKey is undefined, set it to the key
			if (blockKey === undefined) props.key = key;
			// If blockKey is defined, set it to the blockKey
			else props.key = blockKey + '-' + key;
			// If props value is undefined then set it to the value
			if (!props.value) props.value = context.getValue(props.key);
			return props;
		});
		console.log('Parsed properties', parsedProperties);
	});


</script>

<div class='d-flex flex-column properties-block'>
  {#if parsedProperties}
    {#each parsedProperties as prop}
      <PropertyDiscriminator propertyData={prop}></PropertyDiscriminator>
    {/each}
  {/if}
</div>