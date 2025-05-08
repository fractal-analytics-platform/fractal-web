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

	/** @type {boolean} */
	let collapsed = $state(false);

	$effect(() => {
		collapsed = formElement.collapsed;
	});

	/**
	 * @param {MouseEvent} event
	 */
	function toggleCollapse(event) {
		if (event.target instanceof HTMLElement && event.target.classList.contains('bi-info-circle')) {
			// prevent collapse when we are clicking on a property description
			return;
		}
		collapsed = !collapsed;
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
					<button
						class="accordion-button"
						class:collapsed
						onclick={(event) => toggleCollapse(event)}
						type="button"
					>
						<div class="flex-fill">
							<PropertyLabel {formElement} tag="span" />
						</div>
						<div>
							{#if reset !== null && formElement.property.default !== undefined}
								<!-- svelte-ignore a11y_interactive_supports_focus -->
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_missing_attribute -->
								<a class="btn btn-warning me-3" role="button" onclick={handleReset}>Reset</a>
							{/if}
						</div>
					</button>
				</div>
				<div
					id="collapse-{formElement.id}"
					class="accordion-collapse jschema-collapsing"
					class:collapse={collapsed}
					class:show={!collapsed}
				>
					<div class="accordion-body p-1">
						{@render children?.()}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
