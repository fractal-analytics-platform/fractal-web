<script>
	import { onMount } from 'svelte';
	import PropertyDescription from './PropertyDescription.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('../form_element.js').BaseFormElement} formElement
	 * @property {'label'|'span'} [tag]
	 * @property {string} [defaultTitle]
	 * @property {boolean} editable
	 * @property {null|(() => void)} remove function passed by the parent that removes this element
	 */

	/** @type {Props} */
	let { formElement, tag = 'label', defaultTitle = '', editable, remove } = $props();

	let title = $state('');
	onMount(() => {
		formElement.title.subscribe((t) => (title = t));
	});

	let classValue = $derived(
		formElement.required
			? 'fw-bold'
			: !('value' in formElement) ||
				  (formElement.value !== null &&
						formElement.value !== undefined &&
						formElement.value !== '')
				? ''
				: 'text-secondary fw-light'
	);

	const description = $derived(
		formElement.description ||
			('selectedItem' in formElement && formElement.selectedItem
				? /** @type {import('../form_element.js').ConditionalFormElement} */ (
						formElement.selectedItem
					).description
				: '')
	);

	/**
	 * @param {Event} event
	 */
	function handleRemove(event) {
		event.preventDefault();
		event.stopPropagation();
		if (remove) {
			remove();
		}
	}
</script>

{#if remove !== null && formElement.removable}
	<button
		class="btn btn-danger me-3"
		type="button"
		onclick={handleRemove}
		disabled={!editable}
		aria-label="Remove Property Block"
	>
		<i class="bi bi-trash"></i>
	</button>
{/if}

{#if tag === 'label'}
	<label
		class={`${classValue} align-self-center`}
		for={tag === 'label' ? `property-${formElement.id}` : undefined}
	>
		{#if title}
			{title}
		{:else if defaultTitle}
			<span class="visually-hidden">{defaultTitle}</span>
		{/if}
	</label>
{:else}
	<span class={`${classValue} align-self-center`}>
		{#if title}
			{title}
		{:else if defaultTitle}
			<span class="visually-hidden">{defaultTitle}</span>
		{/if}
	</span>
{/if}

<PropertyDescription {description} />
