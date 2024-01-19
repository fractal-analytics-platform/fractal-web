<script>
	import { onMount, getContext } from 'svelte';
	import PropertyDiscriminator from '$lib/components/common/jschema/PropertyDiscriminator.svelte';
	import { mapSchemaProperties } from '$lib/components/common/jschema/schema_management.js';

	/** @type {import('$lib/components/common/jschema/schema_management').default} */
	const schemaManager = getContext('schemaManager');

	/** @type {{[key: string]: import('./jschema-types').JSONSchemaProperty}} */
	export let properties;
	/** @type {string|undefined} */
	export let blockKey = undefined;
	/** @type {string[]|undefined} */
	export let required = undefined;
	export let removePropertyBlock = undefined;

	/** @type {Array<import('./jschema-types').FormProperty>|undefined} */
	let parsedProperties = undefined;
	/** @type {import('$lib/components/common/jschema/schema_management').SchemaProperty[]} */
	let blockProperties = [];

	onMount(() => {
		// Make properties object into an array
		parsedProperties = mapSchemaProperties(properties, blockKey, required);
		parsedProperties.forEach((prop) => {
			blockProperties.push(schemaManager.addProperty(prop));
		});
	});
</script>

<div class="d-flex flex-column properties-block">
	{#if parsedProperties}
		{#each blockProperties as prop}
			{#if removePropertyBlock}
				<button class="btn btn-danger" type="button" on:click={() => removePropertyBlock(prop.key)}>
					Remove Property Block
				</button>
			{/if}
			<PropertyDiscriminator schemaProperty={prop} />
		{/each}
	{/if}
</div>
