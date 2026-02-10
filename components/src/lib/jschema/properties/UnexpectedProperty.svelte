<script>
	import FormBuilder from '../../common/FormBuilder.svelte';
	import CollapsibleProperty from './CollapsibleProperty.svelte';
	import StringProperty from './StringProperty.svelte';
	/**
	 * @typedef {Object} Props
	 * @property {import('../form_element.js').ValueFormElement} formElement
	 * @property {boolean} [editable]
	 */

	/** @type {Props} */
	let { formElement = $bindable(), editable = true } = $props();

	let value = $state({});
	formElement.value.subscribe((v) => (value = v));

	/** @type {string[]} */
	let errors = $state([]);
	formElement.errors.subscribe((v) => (errors = v));
</script>

<div class="border rounded my-2" class:border-danger={errors.length > 0}>
	{#if errors.length > 0}
		<div class="alert alert-danger mb-0 py-1 px-2">{errors.join(', ')}</div>
	{/if}
	{#if typeof value === 'object'}
		<CollapsibleProperty {formElement} padding={1} showErrors={false}>
			<FormBuilder
				args={value}
				onChange={(d) => {
					formElement.value.set(d);
					formElement.notifyChange();
				}}
				allowAddingProperty={false}
				{editable}
				idPrefix={formElement.id}
			/>
		</CollapsibleProperty>
	{:else}
		<StringProperty {formElement} {editable} showErrors={false} />
	{/if}
</div>
