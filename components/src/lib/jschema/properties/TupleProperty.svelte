<script>
	import { onMount } from 'svelte';
	import PropertyDiscriminator from './PropertyDiscriminator.svelte';
	import CollapsibleProperty from './CollapsibleProperty.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import("../form_element.js").TupleFormElement} formElement
	 * @property {boolean} editable
	 * @property {null|(() => void)} remove function passed by the parent that removes this element
	 * @property {any} [children]
	 * @property {null|(() => void)} [reset]
	 */

	/** @type {Props} */
	let { formElement, editable, remove, children = $bindable([]), reset = null } = $props();

	onMount(() => {
		children = formElement.children;
	});

	function addTuple() {
		formElement.addTuple();
		children = formElement.children;
	}

	function removeTuple() {
		formElement.removeTuple();
		children = formElement.children;
	}

	/**
	 * @param {number} index
	 */
	function removeUnexpectedChild(index) {
		formElement.removeUnexpectedChild(index);
		children = formElement.children;
	}
</script>

<CollapsibleProperty {formElement} {reset} {editable} {remove}>
	{#if !formElement.required}
		<div class="d-flex justify-content-center p-2">
			{#if children.length > 0}
				<button class="btn btn-danger" type="button" onclick={removeTuple} disabled={!editable}>
					Remove tuple
				</button>
			{:else}
				<button class="btn btn-primary" type="button" onclick={addTuple} disabled={!editable}>
					Add tuple
				</button>
			{/if}
		</div>
	{/if}
	<div>
		{#each children as nestedProperty, index (index)}
			<div class="d-flex">
				<div class="flex-fill">
					<PropertyDiscriminator
						{editable}
						formElement={nestedProperty}
						remove={nestedProperty.removable ? () => removeUnexpectedChild(index) : null}
					/>
				</div>
			</div>
		{/each}
	</div>
</CollapsibleProperty>
