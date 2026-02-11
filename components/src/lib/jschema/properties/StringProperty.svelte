<script>
	import PropertyLabel from './PropertyLabel.svelte';
	import { get } from 'svelte/store';

	/**
	 * @typedef {Object} Props
	 * @property {import('../form_element.js').ValueFormElement} formElement
	 * @property {boolean} [editable]
	 * @property {boolean} [showErrors]
	 */

	/** @type {Props} */
	let { formElement = $bindable(), editable = true, showErrors = true } = $props();

	let value = $state();
	formElement.value.subscribe((v) => (value = v));
	$effect(() => handleValueChange(value));

	/** @type {HTMLInputElement|undefined} */
	let field = $state();

	/** @type {string[]} */
	let errors = $state([]);
	formElement.errors.subscribe((v) => (errors = v));

	let constant = $derived('const' in formElement.property);

	/**
	 * @param {any} value
	 */
	function handleValueChange(value) {
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
		<PropertyLabel {formElement} defaultTitle="String argument" />
	</div>
	<div class="property-input ms-auto w-50 has-validation">
		<input
			type="text"
			bind:this={field}
			bind:value
			class="form-control"
			id="property-{formElement.id}"
			class:is-invalid={showErrors && errors.length > 0}
			disabled={!editable || constant}
		/>
		<span class="invalid-feedback">
			{showErrors && errors.length > 0 ? errors.join(', ') : ''}
		</span>
	</div>
</div>
