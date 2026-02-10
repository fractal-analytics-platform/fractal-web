<script>
	import PropertyLabel from './PropertyLabel.svelte';
	import { get } from 'svelte/store';

	/**
	 * @typedef {Object} Props
	 * @property {import('../form_element.js').ValueFormElement} formElement
	 * @property {boolean} [editable]
	 */

	/** @type {Props} */
	let { formElement = $bindable(), editable = true } = $props();

	let value = $state();
	formElement.value.subscribe((v) => (value = v));

	/** @type {string[]} */
	let errors = $state([]);
	formElement.errors.subscribe((v) => (errors = v));

	/**
	 * @param {any} event
	 */
	function handleValueChange(event) {
		const value = event.target.checked;
		const previousValue = get(formElement.value);
		if (previousValue === value) {
			return;
		}
		formElement.value.set(value);
		formElement.notifyChange();
	}
</script>

<div class="d-flex align-items-center p-2">
	<div class="property-metadata d-flex flex-row align-self-center w-50">
		<PropertyLabel {formElement} defaultTitle="Boolean argument" tag="span" />
	</div>
	<div class="property-input ms-auto w-25 has-validation">
		<div class="form-check form-switch">
			<input
				id="property-{formElement.id}"
				class="form-check-input"
				type="checkbox"
				onchange={(event) => handleValueChange(event)}
				checked={value === true}
				role="switch"
				class:is-invalid={errors.length > 0}
				disabled={!editable}
			/>
			<span class="invalid-feedback">{errors.join(', ')}</span>
		</div>
	</div>
</div>
