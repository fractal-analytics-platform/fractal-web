<script>
	import { onMount } from 'svelte';
	import PropertyDiscriminator from './PropertyDiscriminator.svelte';
	import CollapsibleProperty from './CollapsibleProperty.svelte';

	/** @type {import("../form_element.js").ArrayFormElement} */
	export let formElement;
	export let editable = true;

	export let children = [];

	/**
	 * @type {null|(() => void)}
	 */
	export let reset = null;

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

	$: canAddChildren =
		editable &&
		(typeof formElement.maxItems !== 'number' || children.length < formElement.maxItems);

	$: canRemoveChildren =
		editable &&
		!(
			formElement.required &&
			typeof formElement.minItems === 'number' &&
			children.length <= formElement.minItems
		);
</script>

<CollapsibleProperty {formElement} {reset}>
	<div class="d-flex justify-content-center p-2">
		<button
			class="btn btn-primary"
			type="button"
			on:click={() => addChild()}
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
						<button class="btn btn-warning" type="button" on:click={() => removeChild(index)}>
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
							on:click|preventDefault={() => moveChildUp(index)}
							aria-label="Move item up"
							disabled={!editable && index === 0}
						>
							<i class="bi-arrow-up" />
						</button>
						<button
							class="btn btn-light"
							on:click|preventDefault={() => moveChildDown(index)}
							aria-label="Move item down"
							disabled={!editable && index === children.length - 1}
						>
							<i class="bi-arrow-down" />
						</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</CollapsibleProperty>
