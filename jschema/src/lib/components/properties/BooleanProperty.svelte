<script>
	import PropertyLabel from './PropertyLabel.svelte';

	/** @type {import('../form_element.js').ValueFormElement} */
	export let formElement;

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
				on:change={handleValueChange}
				role="switch"
			/>
		</div>
	</div>
</div>
