<script>
	import { onMount } from 'svelte';
	import PropertyDiscriminator from './PropertyDiscriminator.svelte';
	import CollapsibleProperty from './CollapsibleProperty.svelte';
	import ObjectProperty from './ObjectProperty.svelte';
	import PropertyDescription from './PropertyDescription.svelte';

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
	/** @type {string[]} */
	let selectedElementErrors = $state([]);

	formElement.errors.subscribe((v) => (errors = v));

	/**
	 * It is necessary to copy the children reference to trigger svelte reactivity
	 */
	let selectedItem = $state();
	let selectedIndex = $state(0);

	/** @type {string[]} */
	let options = $state([]);

	/**
	 * @type {Array<import("../../types/form").FormElement>}
	 */
	let unexpectedChildren = $state([]);

	onMount(() => {
		options = formElement.property.oneOf.map((o) => o.title);
		selectedItem = formElement.selectedItem;
		formElement.selectedIndex.subscribe((v) => (selectedIndex = v));
		unexpectedChildren = formElement.unexpectedChildren;
	});

	function selectionChanged() {
		formElement.selectChild(selectedIndex);
		selectedItem = formElement.selectedItem;
		unexpectedChildren = formElement.unexpectedChildren;
	}

	/**
	 * @param {number} index
	 */
	function removeUnexpectedChild(index) {
		formElement.removeUnexpectedChild(index);
		unexpectedChildren = formElement.unexpectedChildren;
	}

	$effect(() => {
		if (selectedItem) {
			selectedItem.errors.subscribe((e) => (selectedElementErrors = e));
		}
	});
</script>

{#if formElement.discriminator}
	{#key selectedItem}
		<CollapsibleProperty {formElement} {reset} showErrors={false}>
			<div class="mx-2">
				{#each errors as error, index (index)}
					<div class="alert alert-danger mb-1 py-1 px-2">{error}</div>
				{/each}
				{#each selectedElementErrors as error, index (index)}
					<div class="alert alert-danger mb-1 py-1 px-2">{error}</div>
				{/each}
				<div class="d-flex align-items-center mt-2">
					<div class="property-metadata d-flex flex-row align-self-center w-50">
						<label for="discriminator-{formElement.id}" class="fw-bold">
							{formElement.discriminator.title || formElement.discriminator.key}
						</label>
						<PropertyDescription description={formElement.discriminator.description} />
					</div>
					<div class="property-input ms-auto w-50 has-validation">
						<select
							class="form-select"
							bind:value={selectedIndex}
							onchange={selectionChanged}
							id="discriminator-{formElement.id}"
							class:is-invalid={selectedIndex === -1}
						>
							{#if selectedIndex === -1}
								<option value={-1}>Select...</option>
							{/if}
							{#each formElement.discriminator.values as option, index (index)}
								<option value={index}>{option}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
			{#if selectedItem}
				<ObjectProperty formElement={selectedItem} {editable} showErrors={false} />
			{/if}
		</CollapsibleProperty>
	{/key}
{:else}
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
{/if}

{#key unexpectedChildren}
	{#each unexpectedChildren as child, index (index)}
		<div class="property-block">
			{#if child.removable}
				<button
					class="btn btn-danger w-100 mt-2"
					type="button"
					onclick={() => removeUnexpectedChild(index)}
					disabled={!editable}
				>
					Remove Property Block
				</button>
			{/if}
			<div class="d-flex flex-column properties-block" id="{child.id}-wrapper">
				<PropertyDiscriminator formElement={unexpectedChildren[index]} {editable} />
			</div>
		</div>
	{/each}
{/key}
