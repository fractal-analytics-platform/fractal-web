<script>
	import PropertyLabel from './PropertyLabel.svelte';

	/** @type {import('../form_element.js').ValueFormElement} */
	export let formElement;
	export let editable = true;

	/** @type {HTMLInputElement} */
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
		<PropertyLabel {formElement} defaultTitle="String argument" />
	</div>
	<div class="property-input ms-auto w-50 has-validation">
		<input
			type="text"
			bind:this={field}
			bind:value={formElement.value}
			on:input={handleValueChange}
			class="form-control"
			id="property-{formElement.id}"
			class:is-invalid={validationError}
			disabled={!editable}
		/>
		<span class="invalid-feedback">{validationError}</span>
	</div>
</div>
