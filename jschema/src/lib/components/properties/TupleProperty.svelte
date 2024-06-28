<script>
	import { onMount } from 'svelte';
	import PropertyDiscriminator from './PropertyDiscriminator.svelte';
	import CollapsibleProperty from './CollapsibleProperty.svelte';

	/** @type {import("../form_element.js").TupleFormElement} */
	export let formElement;

	export let children = [];

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
	function clearChild(index) {
		formElement.clearChild(index);
		children = formElement.children;
	}
</script>

<CollapsibleProperty {formElement}>
	<div class="d-flex justify-content-center p-2">
		{#if !formElement.required}
			{#if children.length > 0}
				<button class="btn btn-primary" type="button" on:click={removeTuple}> Remove tuple </button>
			{:else}
				<button class="btn btn-primary" type="button" on:click={addTuple}> Add tuple </button>
			{/if}
		{/if}
	</div>
	<div>
		{#each children as nestedProperty, index (nestedProperty.id)}
			<div class="d-flex">
				<div class="align-self-center m-2">
					{#if children[index].type !== 'array' && children[index].type !== 'tuple' && children[index].type !== 'object'}
						<button class="btn btn-warning" type="button" on:click={() => clearChild(index)}>
							Clear
						</button>
					{/if}
				</div>
				<div class="flex-fill">
					<PropertyDiscriminator formElement={nestedProperty} />
				</div>
			</div>
		{/each}
	</div>
</CollapsibleProperty>
