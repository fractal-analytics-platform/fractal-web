<script>
	import { getContext } from 'svelte';
	import PropertyDescription from '$lib/components/common/jschema/PropertyDescription.svelte';

	const schemaManager = getContext('schemaManager');

	/** @type {import('$lib/components/common/jschema/schema_management').SchemaProperty} */
	export let schemaProperty;

	function handleValueChange() {
		schemaManager.updateValue(schemaProperty.key, schemaProperty.value);
	}
</script>

<div class="d-flex align-items-center p-2">
	<div class="property-metadata d-flex flex-row align-self-center w-50">
		<label class={schemaProperty.isRequired() ? 'fw-bold' : ''} for="property-{schemaProperty.key}">
			{schemaProperty.title || 'Enum argument'}
		</label>
		<PropertyDescription description={schemaProperty.description} />
	</div>
	<div class="property-input ms-auto w-50">
		<select
			bind:value={schemaProperty.value}
			on:change={handleValueChange}
			class="form-control"
			id="property-{schemaProperty.key}"
		>
			<option value={null}>Select...</option>
			{#each schemaProperty.referenceSchema.enum as optionValue}
				<option>{optionValue}</option>
			{/each}
		</select>
	</div>
</div>
