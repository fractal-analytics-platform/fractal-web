<script>
	import PropertyLabel from './PropertyLabel.svelte';
	
	/**
	 * @typedef {Object} Props
	 * @property {import("../../types/form").CollapsibleFormElement} formElement
	 * @property {null|(() => void)} [reset] - Function passed by the parent that reset this element to its default value (used only on top-level objects)
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { formElement = $bindable(), reset = null, children } = $props();

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

	/**
	 * @param {Event} event
	 */
	function handleReset(event) {
		event.preventDefault();
		event.stopPropagation();
		if (reset) {
			reset();
		}
	}
</script>

<div class="d-flex flex-column p-2">
	<div class="my-2">
		<div class="accordion" id="accordion-{formElement.id}">
			<div class="accordion-item">
				<div class="accordion-header">
					<a
						class="accordion-button"
						class:collapsed={formElement.collapsed}
						onclick={(event) => toggleCollapse(event)}
						role="button"
					>
						<div class="flex-fill">
							<PropertyLabel {formElement} tag="span" />
						</div>
						<div>
							{#if reset !== null && formElement.property.default !== undefined}
								<button class="btn btn-warning me-3" onclick={handleReset}> Reset </button>
							{/if}
						</div>
					</a>
				</div>
				<div
					id="collapse-{formElement.id}"
					class="accordion-collapse jschema-collapsing"
					class:collapse={formElement.collapsed}
					class:show={!formElement.collapsed}
				>
					<div class="accordion-body p-1">
						{@render children?.()}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
