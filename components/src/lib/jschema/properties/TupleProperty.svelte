<script>
	import { onMount } from 'svelte';
	import PropertyDiscriminator from './PropertyDiscriminator.svelte';
	import CollapsibleProperty from './CollapsibleProperty.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import("../form_element.js").TupleFormElement} formElement
	 * @property {boolean} [editable]
	 * @property {any} [children]
	 * @property {null|(() => void)} [reset]
	 */

	/** @type {Props} */
	let { formElement, editable = true, children = $bindable([]), reset = null } = $props();

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

<CollapsibleProperty {formElement} {reset}>
	<div class="d-flex justify-content-center p-2">
		{#if !formElement.required}
			{#if children.length > 0}
				<button class="btn btn-primary" type="button" onclick={removeTuple} disabled={!editable}>
					Remove tuple
				</button>
			{:else}
				<button class="btn btn-primary" type="button" onclick={addTuple} disabled={!editable}>
					Add tuple
				</button>
			{/if}
		{/if}
	</div>
	<div>
		{#each children as nestedProperty, index (index)}
			<div class="d-flex">
				<div class="flex-fill">
					{#if nestedProperty.removable}
						<button
							class="btn btn-danger w-100 mt-2"
							type="button"
							onclick={() => removeUnexpectedChild(index)}
							disabled={!editable}
						>
							Remove Property Block
						</button>
					{/if}
					<PropertyDiscriminator {editable} formElement={nestedProperty} />
				</div>
			</div>
		{/each}
	</div>
</CollapsibleProperty>
