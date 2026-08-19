<script>
	import PropertyLabel from './PropertyLabel.svelte';
	import { get } from 'svelte/store';

	/**
	 * @typedef {Object} Props
	 * @property {import('../form_element.js').NumberFormElement} formElement
	 * @property {boolean} editable
	 * @property {null|(() => void)} remove function passed by the parent that removes this element
	 * @property {null|((oldKey: string, newKey: string) => void)} renameKey function passed by the parent that renames a key of this element
	 */

	/** @type {Props} */
	let { formElement = $bindable(), editable, remove, renameKey } = $props();

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
		const previousValue = get(formElement.value);
		if (previousValue === value) {
			return;
		}
		formElement.value.set(value);
		formElement.notifyChange();
	}
</script>

<div class="d-flex p-2">
	<div class="property-metadata d-flex flex-row align-self-center w-50">
		<PropertyLabel {formElement} {editable} {remove} {renameKey} defaultTitle="Number argument" />
	</div>
	<div class="property-input ms-auto w-50 has-validation">
		<input
			type="text"
			bind:this={field}
			bind:value
			class="form-control"
			id="property-{formElement.id}"
			class:is-invalid={errors.length > 0}
			disabled={!editable}
		/>
		<span class="invalid-feedback">{errors.join(', ')}</span>
	</div>
</div>
