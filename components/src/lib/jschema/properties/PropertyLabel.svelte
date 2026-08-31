<script>
	import { onMount, tick } from 'svelte';
	import PropertyDescription from './PropertyDescription.svelte';
	import { formatMarkdown } from '../../common/utils';

	/**
	 * @typedef {Object} Props
	 * @property {import('../form_element.js').BaseFormElement} formElement
	 * @property {'label'|'span'} [tag]
	 * @property {string} [defaultTitle]
	 * @property {boolean} editable
	 * @property {null|(() => void)} remove function passed by the parent that removes this element
	 * @property {null|((oldKey: string, newKey: string) => void)} renameKey function passed by the parent that renames a key of this element
	 */

	/** @type {Props} */
	let { formElement, tag = 'label', defaultTitle = '', editable, remove, renameKey } = $props();

	let title = $state('');
	onMount(() => {
		formElement.title.subscribe((t) => (title = t));
	});

	let keyInEditing = $state(false);
	let newKey = $state('');
	let invalidKey = $state(false);
	let renameKeyError = $state('');

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
		formElement.description
			? formatMarkdown(formElement.description)
			: 'selectedItem' in formElement && formElement.selectedItem
				? formatMarkdown(
						/** @type {import('../form_element.js').ConditionalFormElement} */ (
							formElement.selectedItem
						).description
					)
				: ''
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

	async function editKey() {
		invalidKey = false;
		renameKeyError = '';
		newKey = title;
		keyInEditing = true;
		await tick();
		const input = document.getElementById(`edit-key-${formElement.id}`);
		input?.focus();
	}

	function saveKey() {
		try {
			if (renameKey) {
				renameKey(title, newKey.trim());
			}
			keyInEditing = false;
		} catch (err) {
			invalidKey = true;
			const errorMessage = /** @type {Error} */ (err).message;
			if ('collapsed' in formElement) {
				/** @type {import('svelte/store').Writable<boolean>} */ (formElement.collapsed).set(false);
				formElement.addError(errorMessage);
			} else {
				renameKeyError = errorMessage;
			}
		}
	}

	/**
	 *
	 * @param {KeyboardEvent} event
	 */
	function handleEditKeyKeydown(event) {
		renameKeyError = '';
		invalidKey = false;
		if (event.key === 'Enter') {
			saveKey();
		}
	}
</script>

{#if remove !== null && formElement.removable}
	<button
		class="btn btn-danger me-3 btn-remove-property"
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
			{#if !keyInEditing}
				{title}
			{/if}
		{:else if defaultTitle}
			<span class="visually-hidden">{defaultTitle}</span>
		{/if}
	</label>
{:else}
	<span class={`${classValue} align-self-center`} id="property-label-{formElement.id}">
		{#if title}
			{#if !keyInEditing}
				{title}
			{/if}
		{:else if defaultTitle}
			<span class="visually-hidden">{defaultTitle}</span>
		{/if}
	</span>
{/if}

{#if editable && remove !== null && formElement.removable}
	{#if keyInEditing}
		<div class="edit-key-input-wrapper">
			<div class="input-group" class:has-validation={renameKeyError}>
				<input
					type="text"
					class="form-control"
					placeholder="Key"
					bind:value={newKey}
					class:is-invalid={invalidKey}
					id="edit-key-{formElement.id}"
					onkeydown={handleEditKeyKeydown}
				/>
				<button class="btn btn-outline-secondary" type="button" aria-label="Save" onclick={saveKey}>
					<i class="bi bi-check2"></i>
				</button>
				{#if renameKeyError}
					<span class="invalid-feedback">{renameKeyError}</span>
				{/if}
			</div>
		</div>
	{:else}
		<button type="button" class="btn btn-link pt-1" aria-label="Edit key" onclick={editKey}>
			<i class="bi bi-pencil"></i>
		</button>
	{/if}
{/if}

<PropertyDescription {description} html={true} />

<style>
	.btn-remove-property {
		max-height: 38px;
	}
</style>
