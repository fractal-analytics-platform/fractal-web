<script>
	import { getContext } from 'svelte';
	import PropertyDescription from '$lib/components/common/jschema/PropertyDescription.svelte';

	const schemaManager = getContext('schemaManager');

	/** @type {import('$lib/components/common/jschema/schema_management').SchemaProperty} */
	export let schemaProperty;

	let hasChanged = false;

	function handleValueChange() {
		schemaManager.updateValue(schemaProperty.key, schemaProperty.value);
		hasChanged = true;
	}

	/**
	 * @param {object} referenceSchema
	 */
	function getMin(referenceSchema) {
		if ('minimum' in referenceSchema) {
			return referenceSchema.minimum;
		} else if ('exclusiveMinimum' in referenceSchema) {
			return parseInt(referenceSchema.exclusiveMinimum) + 1;
		}
		return null;
	}

	/**
	 * @param {object} referenceSchema
	 */
	function getMax(referenceSchema) {
		if ('maximum' in referenceSchema) {
			return referenceSchema.maximum;
		} else if ('exclusiveMaximum' in referenceSchema) {
			return parseInt(referenceSchema.exclusiveMaximum) - 1;
		}
		return null;
	}

	let validationError = '';

	/** @type {HTMLInputElement} */
	let inputField;

	function validate() {
		if (inputField.validity.badInput) {
			validationError = 'Should be a number';
			return;
		}
		if (inputField.value === '') {
			if (schemaProperty.isRequired()) {
				validationError = 'Field is required';
			} else {
				validationError = '';
			}
			return;
		}
		const num = parseInt(inputField.value);
		const min = getMin(schemaProperty.referenceSchema);
		const max = getMax(schemaProperty.referenceSchema);
		if (min !== null && num < min) {
			validationError = 'Should be greater or equal than ' + min;
			return;
		}
		if (max !== null && num > max) {
			validationError = 'Should be lower or equal than ' + max;
			return;
		}
		validationError = '';
	}
</script>

<div class="d-flex align-items-center p-2">
	<div class="property-metadata d-flex flex-row align-self-center w-50">
		<label class={schemaProperty.isRequired() ? 'fw-bold' : ''} for="property-{schemaProperty.key}">
			{schemaProperty.title || 'Number argument'}
		</label>
		<PropertyDescription description={schemaProperty.description} />
	</div>
	<div class="property-input ms-auto w-25 has-validation">
		<input
			type="number"
			bind:this={inputField}
			bind:value={schemaProperty.value}
			on:change={handleValueChange}
			class="form-control"
			id="property-{schemaProperty.key}"
			min={getMin(schemaProperty.referenceSchema)}
			max={getMax(schemaProperty.referenceSchema)}
			on:input={validate}
			class:is-invalid={validationError}
		/>
		<span class="invalid-feedback">{validationError}</span>
	</div>
</div>
