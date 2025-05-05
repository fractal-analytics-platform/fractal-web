<script>
	import PropertyLabel from './PropertyLabel.svelte';

	
	/**
	 * @typedef {Object} Props
	 * @property {import('../form_element.js').NumberFormElement} formElement
	 * @property {boolean} [editable]
	 */

	/** @type {Props} */
	let { formElement = $bindable(), editable = true } = $props();

	/** @type {HTMLInputElement} */
	let field = $state();
	let validationError = $state('');

	function handleValueChange() {
		validate();
		formElement.notifyChange();
	}

	function validate() {
		validationError = '';
		formElement.badInput = field.validity.badInput;
		if (formElement.badInput) {
			validationError = 'Should be a number';
			return;
		}
		if (field.value === '') {
			if (formElement.required) {
				validationError = 'Field is required';
			} else {
				validationError = '';
			}
			return;
		}
		const num = parseInt(field.value);
		const min = formElement.min;
		const max = formElement.max;
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
		<PropertyLabel {formElement} defaultTitle="Number argument" />
	</div>
	<div class="property-input ms-auto w-50 has-validation">
		<input
			type="number"
			bind:this={field}
			bind:value={formElement.value}
			oninput={handleValueChange}
			min={formElement.min}
			max={formElement.max}
			class="form-control"
			id="property-{formElement.id}"
			class:is-invalid={validationError}
			disabled={!editable}
		/>
		<span class="invalid-feedback">{validationError}</span>
	</div>
</div>
