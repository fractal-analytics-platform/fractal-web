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
		<span class={schemaProperty.isRequired() ? 'fw-bold' : ''}>{schemaProperty.title || 'Boolean argument'}</span>
		<PropertyDescription description={schemaProperty.description} />
	</div>
	<div class="property-input ms-auto w-25">
		<div class="form-check">
			<input
				id="property-{schemaProperty.key}"
				type="checkbox"
				bind:checked={schemaProperty.value}
				on:change={handleValueChange}
				class="form-check-input"
			/>
			<label class="form-check-label" for="property-{schemaProperty.key}">
				{schemaProperty.value}
			</label>
		</div>
	</div>
</div>
