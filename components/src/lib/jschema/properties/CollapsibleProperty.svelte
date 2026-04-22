<script>
	import { onMount } from 'svelte';
	import PropertyLabel from './PropertyLabel.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import("../../types/form").CollapsibleFormElement} formElement
	 * @property {null|(() => void)} remove function passed by the parent that removes this element
	 * @property {boolean} editable
	 * @property {null|(() => void)} [reset] function passed by the parent that resets this element to its default value (used only on top-level objects)
	 * @property {null|(() => void)} [init] - Function passed by the parent that initializes a nullable element
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
		init = null,
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

	let isNull = $state(false);

	onMount(() => {
		if ('isNull' in formElement) {
			formElement.isNull.subscribe((n) => (isNull = n));
		}
	});

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
		formElement.collapsed = collapsed;
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

	/**
	 * @param {any} event
	 */
	function toggleNull(event) {
		event.preventDefault();
		event.stopPropagation();
		const value = event.target.checked;
		if (value && init) {
			init();
		} else if (!value && 'setToNull' in formElement) {
			formElement.setToNull();
		}
		formElement.collapsed = !value;
		collapsed = formElement.collapsed;
	}

	const showResetButton = $derived(
		reset !== null &&
			formElement.property.default !== undefined &&
			!(formElement.nullable && formElement.property.default === null)
	);
</script>

<div class="d-flex flex-column p-{padding}" class:is-null={isNull}>
	<div class="my-2">
		<div class="accordion" id="accordion-{formElement.id}">
			<div class="accordion-item" class:border-danger={hasErrors}>
				<div class="accordion-header">
					<button
						class="accordion-button"
						class:collapsed
						onclick={(event) => toggleCollapse(event)}
						type="button"
						disabled={isNull}
					>
						<div class="flex-fill">
							<PropertyLabel {formElement} {editable} {remove} tag="span" />
						</div>
						<!-- svelte-ignore a11y_interactive_supports_focus -->
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_missing_attribute -->
						<div>
							{#if formElement.nullable}
								<div class="form-check form-switch">
									<input
										class="form-check-input"
										disabled={!editable}
										type="checkbox"
										role="switch"
										checked={isNull === false}
										onchange={(event) => toggleNull(event)}
										aria-label={isNull ? 'Set' : 'Unset'}
									/>
								</div>
							{/if}
							{#if showResetButton}
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
						{#if showErrors}
							{#each errors as error, index (index)}
								<div class="alert alert-danger mb-1 py-1 px-2">{error}</div>
							{/each}
						{/if}
						{#if !isNull}
							{@render children?.()}
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.is-null button {
		background-color: #eee !important;
		border-color: #bbb !important;
		color: #666;
	}

	.is-null .accordion-button::after {
		display: none;
	}
</style>
