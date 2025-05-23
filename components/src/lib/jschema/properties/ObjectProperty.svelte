<script>
	import { onMount } from 'svelte';
	import PropertyDiscriminator from './PropertyDiscriminator.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import("../form_element.js").ObjectFormElement} formElement
	 * @property {boolean} [isRoot]
	 * @property {boolean} [editable]
	 */

	/** @type {Props} */
	let { formElement, isRoot = false, editable = true } = $props();

	/**
	 * It is necessary to copy the children reference to trigger svelte reactivity
	 * @type {Array<import("../../types/form").FormElement>}
	 */
	let children = $state([]);

	onMount(() => {
		children = formElement.children;
	});

	let newPropertyKey = $state('');
	let addPropertyError = $state('');

	function addProperty() {
		try {
			addPropertyError = '';
			formElement.addChild(newPropertyKey.trim());
			children = formElement.children;
			newPropertyKey = '';
		} catch (err) {
			addPropertyError = /** @type {Error} */ (err).message;
		}
	}

	/**
	 * @param {string} key
	 */
	function removeProperty(key) {
		formElement.removeChild(key);
		children = formElement.children;
	}

	/**
	 * @param {number} index
	 */
	function resetChild(index) {
		formElement.resetChild(index);
		children = formElement.children;
	}
</script>

{#if formElement.additionalProperties}
	<div class="d-flex justify-content-center">
		<form class="row row-cols-auto g-3 align-items-center p-2 flex-grow-1">
			<div class="col-lg-6 offset-lg-3 mb-1">
				<div class="input-group" class:has-validation={addPropertyError}>
					<input
						type="text"
						bind:value={newPropertyKey}
						placeholder="Key"
						class="form-control"
						class:is-invalid={addPropertyError}
						disabled={!editable}
					/>
					<button class="btn btn-primary" type="button" onclick={addProperty} disabled={!editable}>
						Add property
					</button>
					{#if addPropertyError}
						<div class="invalid-feedback">{addPropertyError}</div>
					{/if}
				</div>
			</div>
		</form>
	</div>
{/if}
{#key children}
	{#each children as child, index (index)}
		<div class="property-block">
			{#if child.removable}
				<button
					class="btn btn-danger w-100"
					type="button"
					onclick={() => removeProperty(/**@type {string}*/ (child.key))}
					disabled={!editable}
				>
					Remove Property Block
				</button>
			{/if}
			<div class="d-flex flex-column properties-block" id="{child.id}-wrapper">
				<PropertyDiscriminator
					formElement={children[index]}
					{editable}
					reset={isRoot ? () => resetChild(index) : null}
				/>
			</div>
		</div>
	{/each}
{/key}

<style>
	.property-block:not(:last-child) {
		border-bottom: 1px solid #dee2e6;
	}
</style>
