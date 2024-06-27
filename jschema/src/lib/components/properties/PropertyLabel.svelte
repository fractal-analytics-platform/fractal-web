<script>
	import PropertyDescription from './PropertyDescription.svelte';

	/** @type {import('../form_element.js').BaseFormElement} */
	export let formElement;
	/** @type {'label'|'span'} */
	export let tag = 'label';
	export let defaultTitle = '';

	$: classValue = formElement.required
		? 'fw-bold'
		: !('value' in formElement) ||
		  (formElement.value !== null && formElement.value !== undefined && formElement.value !== '')
		? ''
		: 'text-secondary fw-light';
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

<PropertyDescription description={formElement.description} />
