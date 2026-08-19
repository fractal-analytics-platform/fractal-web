<script>
	import { onMount } from 'svelte';
	import PropertyLabel from './PropertyLabel.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import("../../types/form").CollapsibleFormElement} formElement
	 * @property {null|(() => void)} remove function passed by the parent that removes this element
	 * @property {null|((oldKey: string, newKey: string) => void)} renameKey function passed by the parent that renames a key of this element
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
		renameKey,
		editable,
		children,
		reset = null,
		init = null,
		padding = 2,
		showErrors = true
	} = $props();

	/** @type {boolean} */
	let collapsed = $state(true);
	/** @type {boolean} */
	let hasErrors = $state(false);
	formElement.hasErrors.subscribe((v) => (hasErrors = v));
	/** @type {string[]} */
	let errors = $state([]);
	formElement.errors.subscribe((v) => (errors = v));
	formElement.collapsed.subscribe((c) => (collapsed = c));

	let isNull = $state(false);

	onMount(() => {
		if ('isNull' in formElement) {
			formElement.isNull.subscribe((n) => (isNull = n));
		}
	});

	/**
	 * @param {MouseEvent} event
	 */
	function toggleCollapse(event) {
		if (event.target instanceof HTMLElement && event.target.classList.contains('bi-info-circle')) {
			// prevent collapse when we are clicking on a property description
			return;
		}
		formElement.collapsed.update((oldValue) => !oldValue);
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
		formElement.collapsed.update(() => !value);
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
				<div class="accordion-header collapsible-prop-header">
					<button
						class="accordion-button"
						class:collapsed
						onclick={(event) => toggleCollapse(event)}
						type="button"
						disabled={isNull}
						aria-labelledby="property-label-{formElement.id}"
					>
						&nbsp;
					</button>
					<div class="collapsible-label">
						<div class="flex-fill">
							<PropertyLabel {formElement} {editable} {remove} {renameKey} tag="span" />
						</div>
					</div>
					<div class="collapsible-prop-actions">
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
							<button class="btn btn-warning me-3" type="button" onclick={handleReset}>
								Reset
							</button>
						{/if}
					</div>
				</div>
				<div
					id="collapse-{formElement.id}"
					class="accordion-collapse jschema-collapsing"
					class:collapse={collapsed}
					class:show={!collapsed}
				>
					<div class="accordion-body p-0">
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

	.collapsible-prop-header {
		position: relative;
		z-index: 200;
	}

	.collapsible-prop-actions {
		position: absolute;
		top: 0;
		bottom: 0;
		right: 40px;
		z-index: 300;
	}

	.collapsible-label {
		position: absolute;
		top: 0;
		bottom: 0;
		right: 0;
		left: 0;
		padding: 0 16px;
		z-index: 250;
		pointer-events: none;
	}

	.collapsible-label .flex-fill {
		display: flex;
		align-items: center;
		height: 100%;
	}

	:global(.collapsible-label .property-description) {
		pointer-events: initial;
	}

	.collapsible-prop-actions .btn-warning {
		margin-top: 8px;
	}
	.collapsible-prop-actions .form-switch {
		margin-top: 16px;
		margin-right: 8px;
	}

	:global(.collapsible-prop-header .btn-remove-property) {
		margin-left: -6px;
	}

	:global(.collapsible-prop-header button),
	:global(.collapsible-prop-header input) {
		pointer-events: auto;
	}

	:global(.collapsible-prop-header .edit-key-input-wrapper) {
		width: calc(100% - 120px);
		display: inline-block;
		background-color: white;
		border-radius: var(--bs-border-radius);
	}

	:global(.collapsible-prop-header .invalid-feedback) {
		display: none;
	}
</style>
