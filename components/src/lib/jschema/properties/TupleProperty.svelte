<script>
	import { onMount } from 'svelte';
	import PropertyDiscriminator from './PropertyDiscriminator.svelte';
	import CollapsibleProperty from './CollapsibleProperty.svelte';

	/** @type {import("../form_element.js").TupleFormElement} */
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

	function addTuple() {
		formElement.addTuple();
		children = formElement.children;
	}

	function removeTuple() {
		formElement.removeTuple();
		children = formElement.children;
	}
</script>

<CollapsibleProperty {formElement} {reset}>
	<div class="d-flex justify-content-center p-2">
		{#if !formElement.required}
			{#if children.length > 0}
				<button class="btn btn-primary" type="button" on:click={removeTuple} disabled={!editable}>
					Remove tuple
				</button>
			{:else}
				<button class="btn btn-primary" type="button" on:click={addTuple} disabled={!editable}>
					Add tuple
				</button>
			{/if}
		{/if}
	</div>
	<div>
		{#each children as nestedProperty}
			<div class="d-flex">
				<div class="flex-fill">
					<PropertyDiscriminator {editable} formElement={nestedProperty} />
				</div>
			</div>
		{/each}
	</div>
</CollapsibleProperty>
