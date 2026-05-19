<script>
	import PropertyLabel from './PropertyLabel.svelte';
	import { get } from 'svelte/store';

	/**
	 * @typedef {Object} Props
	 * @property {import('../form_element.js').ValueFormElement} formElement
	 * @property {boolean} editable
	 * @property {null|(() => void)} remove function passed by the parent that removes this element
	 * @property {boolean} [showErrors]
	 */

	/** @type {Props} */
	let { formElement = $bindable(), editable, remove, showErrors = true } = $props();

	let value = $state();
	formElement.value.subscribe((v) => (value = v));
	$effect(() => handleValueChange(value));

	/** @type {string[]} */
	let errors = $state([]);
	formElement.errors.subscribe((v) => (errors = v));

	let constant = $derived('const' in formElement.property);

	/**
	 * @param {any} value
	 */
	function handleValueChange(value) {
		const previousValue = get(formElement.value);
		if (previousValue === value) {
			return;
		}
		formElement.value.set(value);
		formElement.notifyChange();
	}

	/**
	 * @param {string[]} errors
	 */
	function hasJsonError(errors) {
		if (errors.length !== 1) {
			return false;
		}
		try {
			JSON.parse(errors[0]);
			return true;
		} catch {
			return false;
		}
	}
</script>

<div class="d-flex align-items-center p-2">
	<div class="property-metadata d-flex flex-row align-self-center w-25">
		<PropertyLabel {formElement} {editable} {remove} defaultTitle="String argument" />
	</div>
	<div class="property-input ms-auto w-75 has-validation">
		<textarea
			bind:value
			class="form-control"
			id="property-{formElement.id}"
			class:is-invalid={showErrors && errors.length > 0}
			disabled={!editable || constant}
			rows="8"
		></textarea>
		<span class="invalid-feedback">
			{#if showErrors && errors.length > 0}
				{#if hasJsonError(errors)}
					Invalid data ({JSON.parse(errors[0]).length}
					{`${JSON.parse(errors[0]).length === 1 ? 'error' : 'errors'}`})
				{:else}
					{errors.join(', ')}
				{/if}
			{/if}
		</span>
	</div>
</div>

{#if showErrors && hasJsonError(errors)}
	<div class="accordion mb-2" id="contentSchemaErrors-{formElement.id}">
		{#each JSON.parse(errors[0]) as error, i (i)}
			<div class="accordion-item border-danger">
				<h2 class="accordion-header">
					<button
						class="accordion-button collapsed p-2"
						type="button"
						data-bs-toggle="collapse"
						data-bs-target="#contentSchemaErrors-{formElement.id}-Collapse-{i}"
						aria-expanded="false"
						aria-controls="contentSchemaErrors-{formElement.id}-Collapse-{i}"
					>
						Error #{i + 1}
					</button>
				</h2>
				<div
					id="contentSchemaErrors-{formElement.id}-Collapse-{i}"
					class="accordion-collapse collapse"
					data-bs-parent="#contentSchemaErrors-{formElement.id}"
				>
					<div class="accordion-body p-0">
						<div class="alert alert-danger">
							<pre>{JSON.stringify(error, null, 2)}</pre>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
