<script>
	import PropertyLabel from './PropertyLabel.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import("../../types/form").CollapsibleFormElement} formElement
	 * @property {null|(() => void)} remove function passed by the parent that removes this element
	 * @property {boolean} editable
	 * @property {null|(() => void)} [reset] function passed by the parent that resets this element to its default value (used only on top-level objects)
	 * @property {import('svelte').Snippet} [children]
	 * @property {number} [padding]
	 * @property {boolean} [showErrors]
	 */

	/** @type {Props} */
	let {
		formElement = $bindable(),
		remove,
		editable,
		children,
		reset = null,
		padding = 2,
		showErrors = true
	} = $props();

	/** @type {boolean} */
	let collapsed = $state(false);
	/** @type {boolean} */
	let hasErrors = $state(false);
	formElement.hasErrors.subscribe((v) => (hasErrors = v));
	/** @type {string[]} */
	let errors = $state([]);
	formElement.errors.subscribe((v) => (errors = v));

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

<div class="d-flex flex-column p-{padding}">
	<div class="my-2">
		<div class="accordion" id="accordion-{formElement.id}">
			<div class="accordion-item" class:border-danger={hasErrors}>
				<div class="accordion-header">
					<!-- svelte-ignore a11y_missing_attribute -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_interactive_supports_focus -->
					<a
						class="accordion-button text-decoration-none"
						class:collapsed
						onclick={(event) => toggleCollapse(event)}
						role="button"
					>
						<div class="flex-fill">
							<PropertyLabel {formElement} {editable} {remove} tag="span" />
						</div>
						<div>
							{#if reset !== null && formElement.property.default !== undefined}
								<button
									class="btn btn-warning me-3"
									type="button"
									onclick={handleReset}
									disabled={!editable}
								>
									Reset
								</button>
							{/if}
						</div>
					</a>
				</div>
				<div
					id="collapse-{formElement.id}"
					class="accordion-collapse jschema-collapsing"
					class:collapse={collapsed}
					class:show={!collapsed}
				>
					<div class="accordion-body p-1">
						{#if showErrors}
							{#each errors as error, index (index)}
								<div class="alert alert-danger mb-1 py-1 px-2">{error}</div>
							{/each}
						{/if}
						{@render children?.()}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
