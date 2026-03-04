<script>
	import PropertyDescription from './PropertyDescription.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('../form_element.js').BaseFormElement} formElement
	 * @property {'label'|'span'} [tag]
	 * @property {string} [defaultTitle]
	 */

	/** @type {Props} */
	let { formElement, tag = 'label', defaultTitle = '' } = $props();

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
</script>

{#if tag === 'label'}
	<label class={classValue} for={tag === 'label' ? `property-${formElement.id}` : undefined}>
		{#if formElement.title}
			{formElement.title}
		{:else if defaultTitle}
			<span class="visually-hidden">{defaultTitle}</span>
		{/if}
	</label>
{:else}
	<span class={classValue}>
		{#if formElement.title}
			{formElement.title}
		{:else if defaultTitle}
			<span class="visually-hidden">{defaultTitle}</span>
		{/if}
	</span>
{/if}

<PropertyDescription {description} />
