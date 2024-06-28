<script>
	import { onMount } from 'svelte';
	import PropertyDiscriminator from './PropertyDiscriminator.svelte';

	/** @type {import("../form_element.js").ObjectFormElement} */
	export let formElement;

	/**
	 * It is necessary to copy the children reference to trigger svelte reactivity
	 * @type {Array<import("../../types/form").FormElement>}
	 */
	let children = [];

	onMount(() => {
		children = formElement.children;
	});

	let newPropertyKey = '';
	let addPropertyError = '';

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
					/>
					<button class="btn btn-primary" type="button" on:click={addProperty}>
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
{#each children as child}
	<div class="property-block">
		{#if child.removable}
			<button
				class="btn btn-danger w-100"
				type="button"
				on:click={() => removeProperty(/**@type {string}*/ (child.key))}
			>
				Remove Property Block
			</button>
		{/if}
		<div class="d-flex flex-column properties-block" id="{child.id}-wrapper">
			<PropertyDiscriminator formElement={child} />
		</div>
	</div>
{/each}

<style>
	.property-block:not(:last-child) {
		border-bottom: 1px solid #dee2e6;
	}
</style>
