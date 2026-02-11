<script>
	import { onMount } from 'svelte';
	import PropertyDiscriminator from './PropertyDiscriminator.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import("../form_element.js").ConditionalFormElement} formElement
	 * @property {boolean} [editable]
	 * @property {null|(() => void)} [reset] - Function passed by the parent that reset this element to its default value (used only on top-level objects)
	 */

	/** @type {Props} */
	let { formElement = $bindable(), editable, reset = null } = $props();

	/** @type {string[]} */
	let errors = $state([]);
	formElement.errors.subscribe((v) => (errors = v));

	/**
	 * It is necessary to copy the children reference to trigger svelte reactivity
	 * @type {import("../../types/form").FormElement | undefined}
	 */
	let selectedItem = $state();
	let selectedIndex = $state(0);

	let options = $state([]);

	onMount(() => {
		options = formElement.property.oneOf.map((o) => o.title);
		selectedItem = formElement.selectedItem;
		formElement.selectedIndex.subscribe((v) => (selectedIndex = v));
	});

	function selectionChanged() {
		formElement.selectChild(selectedIndex);
		selectedItem = formElement.selectedItem;
	}
</script>

<div class="mx-2">
	<select class="form-select mt-3" bind:value={selectedIndex} onchange={selectionChanged}>
		{#each options as option, index (index)}
			<option value={index}>{option}</option>
		{/each}
	</select>
	{#each errors as error, index (index)}
		<div class="alert alert-danger mt-2 mb-1 py-1 px-2">{error}</div>
	{/each}
</div>

{#key selectedItem}
	{#if selectedItem}
		<PropertyDiscriminator {editable} {reset} formElement={selectedItem} />
	{/if}
{/key}
