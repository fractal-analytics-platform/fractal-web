<script>
	import { onMount } from 'svelte';
	import PropertyLabel from './PropertyLabel.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import("../../types/form").CollapsibleFormElement} formElement
	 * @property {null|(() => void)} [reset] - Function passed by the parent that resets this element to its default value (used only on top-level objects)
	 * @property {null|(() => void)} [init] - Function passed by the parent that initializes a nullable element
	 * @property {import('svelte').Snippet} [children]
	 * @property {number} [padding]
	 * @property {boolean} [showErrors]
	 */

	/** @type {Props} */
	let {
		formElement = $bindable(),
		reset = null,
		init = null,
		children,
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
	 * @param {Event} event
	 */
	function initValue(event) {
		event.preventDefault();
		event.stopPropagation();
		if (init) {
			init();
		}
	}

	/**
	 * @param {Event} event
	 */
	function setToNull(event) {
		event.preventDefault();
		event.stopPropagation();
		if ('setToNull' in formElement) {
			formElement.setToNull();
		}
	}

	const showResetButton = $derived(
		reset !== null &&
			formElement.property.default !== undefined &&
			!(formElement.nullable && formElement.property.default === null)
	);
</script>

<div class="d-flex flex-column p-{padding}">
	<div class="my-2">
		<div class="accordion" id="accordion-{formElement.id}">
			<div class="accordion-item" class:border-danger={hasErrors}>
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
						<!-- svelte-ignore a11y_interactive_supports_focus -->
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_missing_attribute -->
						<div>
							{#if formElement.nullable}
								{#if isNull}
									<a class="btn btn-warning me-3" role="button" onclick={initValue}>Set</a>
								{:else}
									<a class="btn btn-warning me-3" role="button" onclick={setToNull}>Unset</a>
								{/if}
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
						{#if isNull}
							<div class="alert alert-info py-0 px-2 m-0 mt-1">This element is null</div>
						{:else}
							{@render children?.()}
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
