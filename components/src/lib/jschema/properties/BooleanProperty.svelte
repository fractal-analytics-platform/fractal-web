<script>
	import PropertyLabel from './PropertyLabel.svelte';

	
	/**
	 * @typedef {Object} Props
	 * @property {import('../form_element.js').ValueFormElement} formElement
	 * @property {boolean} [editable]
	 */

	/** @type {Props} */
	let { formElement = $bindable(), editable = true } = $props();

	function handleValueChange() {
		formElement.notifyChange();
	}
</script>

<div class="d-flex align-items-center p-2">
	<div class="property-metadata d-flex flex-row align-self-center w-50">
		<PropertyLabel {formElement} defaultTitle="Boolean argument" tag="span" />
	</div>
	<div class="property-input ms-auto w-25">
		<div class="form-check form-switch">
			<input
				id="property-{formElement.id}"
				class="form-check-input"
				type="checkbox"
				bind:checked={formElement.value}
				onchange={handleValueChange}
				role="switch"
				disabled={!editable}
			/>
		</div>
	</div>
</div>
