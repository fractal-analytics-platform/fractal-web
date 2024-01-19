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
			{#if schemaProperty.type === 'integer' || schemaProperty.type === 'number'}
				<NumberProperty {schemaProperty} />
			{/if}
			{#if schemaProperty.type === 'string'}
				{#if 'enum' in schemaProperty}
					<EnumProperty {schemaProperty} />
				{:else}
					<StringProperty {schemaProperty} />
				{/if}
			{/if}
			{#if schemaProperty.type === 'boolean'}
				<BooleanProperty {schemaProperty} />
			{/if}
			{#if schemaProperty.type === 'array'}
				<ArrayProperty {schemaProperty} />
			{/if}
			{#if schemaProperty.type === 'object'}
				<ObjectProperty objectSchema={schemaProperty} />
			{/if}
		</div>
	</div>
{:else}
	<div>
		<p>Unable to display schema property | unknown property type</p>
	</div>
{/if}
