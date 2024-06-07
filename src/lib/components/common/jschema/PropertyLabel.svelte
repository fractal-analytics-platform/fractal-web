<script>
	import PropertyDescription from './PropertyDescription.svelte';

	/** @type {import('$lib/components/common/jschema/schema_management').SchemaProperty} */
	export let schemaProperty;
	/** @type {'label'|'span'} */
	export let tag = 'label';
	export let defaultTitle = '';

	$: classValue = schemaProperty.isRequired()
		? 'fw-bold'
		: schemaProperty.value !== null &&
		  schemaProperty.value !== undefined &&
		  schemaProperty.value !== ''
		? ''
		: 'text-secondary fw-light';
</script>

{#if tag === 'label'}
	<label class={classValue} for={tag === 'label' ? `property-${schemaProperty.key}` : undefined}>
		{#if schemaProperty.title}
			{schemaProperty.title}
		{:else if defaultTitle}
			<span class="visually-hidden">{defaultTitle}</span>
		{/if}
	</label>
{:else}
	<span class={classValue}>
		{#if schemaProperty.title}
			{schemaProperty.title}
		{:else if defaultTitle}
			<span class="visually-hidden">{defaultTitle}</span>
		{/if}
	</span>
{/if}

<PropertyDescription description={schemaProperty.description} />
