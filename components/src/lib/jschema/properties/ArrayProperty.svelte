<script>
	import { preventDefault } from 'svelte/legacy';

	import { onMount } from 'svelte';
	import PropertyDiscriminator from './PropertyDiscriminator.svelte';
	import CollapsibleProperty from './CollapsibleProperty.svelte';

	


	
	/**
	 * @typedef {Object} Props
	 * @property {import("../form_element.js").ArrayFormElement} formElement
	 * @property {boolean} [editable]
	 * @property {any} [children]
	 * @property {null|(() => void)} [reset]
	 */

	/** @type {Props} */
	let {
		formElement,
		editable = true,
		children = $bindable([]),
		reset = null
	} = $props();

	onMount(() => {
		children = formElement.children;
	});

	function addChild() {
		formElement.addChild();
		children = formElement.children;
	}

	/**
	 * @param {number} index
	 */
	function removeChild(index) {
		formElement.removeChild(index);
		children = formElement.children;
	}

	/**
	 * @param {number} index
	 */
	function moveChildUp(index) {
		formElement.moveChildUp(index);
		children = formElement.children;
	}

	/**
	 * @param {number} index
	 */
	function moveChildDown(index) {
		formElement.moveChildDown(index);
		children = formElement.children;
	}

	let canAddChildren =
		$derived(editable &&
		(typeof formElement.maxItems !== 'number' || children.length < formElement.maxItems));

	let canRemoveChildren =
		$derived(editable &&
		!(
			formElement.required &&
			typeof formElement.minItems === 'number' &&
			children.length <= formElement.minItems
		));
</script>

<CollapsibleProperty {formElement} {reset}>
	<div class="d-flex justify-content-center p-2">
		<button
			class="btn btn-primary"
			type="button"
			onclick={() => addChild()}
			disabled={!canAddChildren}
		>
			Add argument to list
		</button>
	</div>
	<div>
		{#each children as nestedProperty, index (nestedProperty.id)}
			<div class="d-flex">
				<div class="align-self-center m-2">
					{#if canRemoveChildren}
						<button class="btn btn-warning" type="button" onclick={() => removeChild(index)}>
							Remove
						</button>
					{/if}
				</div>
				<div class="flex-fill">
					<PropertyDiscriminator {editable} formElement={nestedProperty} />
				</div>
				<div class="align-self-right mt-2 me-2">
					{#if children.length > 1}
						<button
							class="btn btn-light"
							onclick={preventDefault(() => moveChildUp(index))}
							aria-label="Move item up"
							disabled={!editable && index === 0}
						>
							<i class="bi-arrow-up"></i>
						</button>
						<button
							class="btn btn-light"
							onclick={preventDefault(() => moveChildDown(index))}
							aria-label="Move item down"
							disabled={!editable && index === children.length - 1}
						>
							<i class="bi-arrow-down"></i>
						</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</CollapsibleProperty>
