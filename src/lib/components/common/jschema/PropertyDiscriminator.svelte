<script>
	import NumberProperty from '$lib/components/common/jschema/NumberProperty.svelte';
	import EnumProperty from '$lib/components/common/jschema/EnumProperty.svelte';
	import StringProperty from '$lib/components/common/jschema/StringProperty.svelte';
	import BooleanProperty from '$lib/components/common/jschema/BooleanProperty.svelte';
	import ArrayProperty from '$lib/components/common/jschema/ArrayProperty.svelte';
	import ObjectProperty from '$lib/components/common/jschema/ObjectProperty.svelte';

	/** @type {import('$lib/components/common/jschema/schema_management').SchemaProperty|undefined} */
	export let schemaProperty = undefined;

	const key = schemaProperty?.key;
</script>

{#if schemaProperty}
	<div id="block-{key}" class="property-block">
		<div class="property-container">
			{#if Array.isArray(schemaProperty.enum)}
				<EnumProperty {schemaProperty} />
			{:else if schemaProperty.type === 'integer' || schemaProperty.type === 'number'}
				<NumberProperty {schemaProperty} />
			{:else if schemaProperty.type === 'string'}
				<StringProperty {schemaProperty} />
			{:else if schemaProperty.type === 'boolean'}
				<BooleanProperty {schemaProperty} />
			{:else if schemaProperty.type === 'array'}
				<ArrayProperty {schemaProperty} />
			{:else if schemaProperty.type === 'object'}
				<ObjectProperty objectSchema={schemaProperty} />
			{/if}
		</div>
	</div>
{:else}
	<div>
		<p>Unable to display schema property | unknown property type</p>
	</div>
{/if}
