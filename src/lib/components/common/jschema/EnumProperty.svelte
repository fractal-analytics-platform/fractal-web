<script>
	import { getContext } from 'svelte';
	import PropertyLabel from './PropertyLabel.svelte';

	const schemaManager = getContext('schemaManager');

	/** @type {import('$lib/components/common/jschema/schema_management').SchemaProperty} */
	export let schemaProperty;

	function handleValueChange() {
		schemaManager.updateValue(schemaProperty.key, schemaProperty.value);
	}

	/** @type {HTMLSelectElement} */
	let field;
	let validationError = '';

	function validate() {
		validationError = '';
		if (schemaProperty.isRequired() && (!field.value || field.value === 'null')) {
			validationError = 'Field is required';
		}
	}
</script>

<div class="d-flex align-items-center p-2">
	<div class="property-metadata d-flex flex-row align-self-center w-50">
		<PropertyLabel {schemaProperty} defaultTitle="Enum argument" />
	</div>
	<div class="property-input ms-auto w-50 has-validation">
		<select
			bind:this={field}
			bind:value={schemaProperty.value}
			on:change={handleValueChange}
			on:input={validate}
			class="form-control"
			id="property-{schemaProperty.key}"
			class:is-invalid={validationError}
		>
			<option value={null}>Select...</option>
			{#if schemaProperty.enum}
				{#each schemaProperty.enum as optionValue}
					<option>{optionValue}</option>
				{/each}
			{/if}
		</select>
		<span class="invalid-feedback">{validationError}</span>
	</div>
</div>
