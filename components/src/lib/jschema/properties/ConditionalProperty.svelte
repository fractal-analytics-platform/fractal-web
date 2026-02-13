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

	onMount(() => {
		options = formElement.property.oneOf.map((o) => o.title);
		selectedItem = formElement.selectedItem;
		formElement.selectedIndex.subscribe((v) => (selectedIndex = v));
	});

	function selectionChanged() {
		formElement.selectChild(selectedIndex);
		selectedItem = formElement.selectedItem;
	}

	$effect(() => {
		if (selectedItem) {
			selectedItem.errors.subscribe((e) => (selectedElementErrors = e));
		}
	});
</script>

{#if formElement.discriminator && selectedItem}
	{#key selectedItem}
		<CollapsibleProperty {formElement} {reset}>
			<div class="mx-2">
				{#each errors as error, index (index)}
					<div class="alert alert-danger mt-2 mb-1 py-1 px-2">{error}</div>
				{/each}
				{#each selectedElementErrors as error, index (index)}
					<div class="alert alert-danger mt-2 mb-1 py-1 px-2">{error}</div>
				{/each}
				<div class="d-flex align-items-center mt-2">
					<div class="property-metadata d-flex flex-row align-self-center w-50">
						<label for="discriminator-{formElement.id}">
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
						>
							{#each formElement.discriminator.values as option, index (index)}
								<option value={index}>{option}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
			<ObjectProperty formElement={selectedItem} {editable} showErrors={false} />
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
