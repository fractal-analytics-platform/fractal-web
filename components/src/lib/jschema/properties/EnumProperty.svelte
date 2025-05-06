<script>
	import PropertyLabel from './PropertyLabel.svelte';
	
	/**
	 * @typedef {Object} Props
	 * @property {import('../form_element.js').EnumFormElement} formElement
	 * @property {boolean} [editable]
	 */

	/** @type {Props} */
	let { formElement = $bindable(), editable = true } = $props();

	/** @type {HTMLSelectElement|undefined} */
	let field = $state();
	let validationError = $state('');

	function handleValueChange() {
		formElement.notifyChange();
		validationError = '';
		if (formElement.required && field?.value === '') {
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
			onchange={handleValueChange}
			oninput={handleValueChange}
			class="form-select"
			id="property-{formElement.id}"
			class:is-invalid={validationError}
			disabled={!editable}
		>
			<option value="">Select...</option>
			{#each formElement.options as optionValue}
				<option>{optionValue}</option>
			{/each}
		</select>
		<span class="invalid-feedback">{validationError}</span>
	</div>
</div>
