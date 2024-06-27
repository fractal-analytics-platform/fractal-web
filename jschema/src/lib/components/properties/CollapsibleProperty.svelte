<script>
	import PropertyLabel from './PropertyLabel.svelte';

	/** @type {import("../../types/form").CollapsibleFormElement} */
	export let formElement;

	/**
	 * @param {MouseEvent} event
	 */
	function toggleCollapse(event) {
		if (event.target instanceof HTMLElement && event.target.classList.contains('bi-info-circle')) {
			// prevent collapse when we are clicking on a property description
			return;
		}
		formElement.collapsed = !formElement.collapsed;
	}
</script>

<div class="d-flex flex-column p-2">
	<div class="my-2">
		<div class="accordion" id="accordion-{formElement.id}">
			<div class="accordion-item">
				<div class="accordion-header">
					<button
						class="accordion-button"
						class:collapsed={formElement.collapsed}
						type="button"
						on:click={(event) => toggleCollapse(event)}
					>
						<PropertyLabel {formElement} tag="span" />
					</button>
				</div>
				<div
					id="collapse-{formElement.id}"
					class="accordion-collapse jschema-collapsing"
					class:collapse={formElement.collapsed}
					class:show={!formElement.collapsed}
				>
					<div class="accordion-body p-1">
						<slot />
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
