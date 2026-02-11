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

	/** @type {string[]} */
	let errors = $state([]);
	formElement.errors.subscribe((v) => (errors = v));

	/**
	 * @param {any} value
	 */
	function handleValueChange(value) {
		onInput();
		const previousValue = get(formElement.value);
		if (previousValue === value) {
			return;
		}
		formElement.value.set(value);
		formElement.notifyChange();
	}

	function onInput() {
		if (field) {
			if (formElement.badInput !== field.validity.badInput) {
				formElement.badInput = field.validity.badInput;
				formElement.notifyChange();
			}
		}
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
			oninput={onInput}
			class="form-control"
			id="property-{formElement.id}"
			class:is-invalid={errors.length > 0}
			disabled={!editable}
		/>
		<span class="invalid-feedback">{errors.join(', ')}</span>
	</div>
</div>
