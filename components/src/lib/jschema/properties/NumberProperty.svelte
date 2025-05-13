<script>
	import PropertyLabel from './PropertyLabel.svelte';
	import { get } from 'svelte/store';

	/**
	 * @typedef {Object} Props
	 * @property {import('../form_element.js').NumberFormElement} formElement
	 * @property {boolean} [editable]
	 */

	/** @type {Props} */
	let { formElement = $bindable(), editable = true } = $props();

	let value = $state();
	formElement.value.subscribe((v) => (value = v));
	$effect(() => handleValueChange(value));

	/** @type {HTMLInputElement|undefined} */
	let field = $state();
	let validationError = $state('');

	/**
	 * @param {any} value
	 */
	function handleValueChange(value) {
		const previousValue = get(formElement.value);
		if (previousValue === value) {
			return;
		}
		validate();
		formElement.value.set(value);
		formElement.notifyChange();
	}

	function validate() {
		validationError = '';
		if (!field) {
			return;
		}
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
			bind:value
			min={formElement.min}
			max={formElement.max}
			oninput={() => validate()}
			class="form-control"
			id="property-{formElement.id}"
			class:is-invalid={validationError}
			disabled={!editable}
		/>
		<span class="invalid-feedback">{validationError}</span>
	</div>
</div>
