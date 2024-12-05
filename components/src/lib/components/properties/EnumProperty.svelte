<script>
	import PropertyLabel from './PropertyLabel.svelte';

	/** @type {import('../form_element.js').EnumFormElement} */
	export let formElement;

	/** @type {HTMLSelectElement} */
	let field;
	let validationError = '';

	function handleValueChange() {
		formElement.notifyChange();
		validationError = '';
		if (formElement.required && field.value === '') {
			validationError = 'Field is required';
		}
	}
</script>

<div class="d-flex align-items-center p-2">
	<div class="property-metadata d-flex flex-row align-self-center w-50">
		<PropertyLabel {formElement} defaultTitle="Enum argument" />
	</div>
	<div class="property-input ms-auto w-50 has-validation">
		<select
			bind:this={field}
			bind:value={formElement.value}
			on:change={handleValueChange}
			on:input={handleValueChange}
			class="form-select"
			id="property-{formElement.id}"
			class:is-invalid={validationError}
		>
			<option value="">Select...</option>
			{#each formElement.options as optionValue}
				<option>{optionValue}</option>
			{/each}
		</select>
		<span class="invalid-feedback">{validationError}</span>
	</div>
</div>
