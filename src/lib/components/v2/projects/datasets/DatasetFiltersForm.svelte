<script>
	import { objectChanged } from '$lib/common/component_utilities';
	import { tick } from 'svelte';
	import AttributeFilterSelector from './AttributeFilterSelector.svelte';
	import { attributesChanged } from './attributes_utilities';

	/** @type {{ [key: string]: Array<string | number | boolean> }} */
	let initialAttributeFields = {};
	/** @type {{ [key: string]: boolean }} */
	let initialTypeFields = {};

	/** @type {Array<{ key: string, value: string[], type: string, error: string }>} */
	let attributeFiltersList = [];
	/** @type {Array<{ key: string, value: boolean, error: string }>} */
	let typeFiltersList = [];

	/** @type {{ [key: string]: Array<string | number | boolean> }} */
	let existingAttributes = {};
	/** @type {Array<string>} */
	let existingTypes = [];

	/**
	 * @param {{ [key: string]: null | Array<string | number | boolean> }} attributeFilters
	 * @param {{ [key: string]: boolean }} typeFilters
	 * @param {{ [key: string]: Array<string | number | boolean> }} attributes existing attributes, from images
	 * @param {Array<string>} types existing types, from images
	 */
	export function init(attributeFilters, typeFilters, attributes, types) {
		existingAttributes = attributes;
		existingTypes = types;
		attributeFiltersList = Object.entries(attributeFilters)
			.filter(([, v]) => v !== null)
			.map(([k, v]) => {
				const value = /** @type {Array<string | number | boolean>} */ (v);
				return { key: k, value: value.map((v) => v.toString()), type: typeof value[0], error: '' };
			});
		typeFiltersList = Object.entries(typeFilters).map(([k, v]) => {
			return { key: k, value: v, error: '' };
		});
		initialAttributeFields = getAttributes();
		initialTypeFields = getTypes();
	}

	/**
	 * @returns {boolean}
	 */
	export function hasUnsavedChanges() {
		return (
			attributesChanged(initialAttributeFields, getAttributes()) ||
			objectChanged(initialTypeFields, getTypes())
		);
	}

	export function discardChanges() {
		init(initialAttributeFields, initialTypeFields, existingAttributes, existingTypes);
	}

	export function save() {
		initialAttributeFields = getAttributes();
		initialTypeFields = getTypes();
	}

	/**
	 * @returns {{ [key: string]: Array<string | number | boolean> }}
	 */
	export function getAttributes() {
		return Object.fromEntries(
			attributeFiltersList.map((f) => {
				return [f.key, getTypedAttributeValue(f)];
			})
		);
	}

	/**
	 * @returns {{ [key: string]: boolean }}
	 */
	export function getTypes() {
		return Object.fromEntries(
			typeFiltersList.map((f) => {
				return [f.key, f.value];
			})
		);
	}

	export function validateFields() {
		let validFields = true;
		const attributeKeys = [];
		const typesKey = [];
		for (const attributeField of attributeFiltersList) {
			if (!attributeField.key) {
				attributeField.error = 'Key is required';
				validFields = false;
				continue;
			}
			if (!attributeField.value) {
				attributeField.error = 'Value is required';
				validFields = false;
				continue;
			}
			if (attributeKeys.includes(attributeField.key)) {
				attributeField.error = 'Duplicated key';
				validFields = false;
				continue;
			} else {
				attributeKeys.push(attributeField.key);
			}
		}
		for (const typeField of typeFiltersList) {
			if (!typeField.key) {
				typeField.error = 'Key is required';
				validFields = false;
				continue;
			}
			if (typesKey.includes(typeField.key)) {
				typeField.error = 'Duplicated key';
				validFields = false;
				continue;
			} else {
				typesKey.push(typeField.key);
			}
		}
		// Trigger items update
		attributeFiltersList = attributeFiltersList;
		typeFiltersList = typeFiltersList;
		return validFields;
	}

	export function resetErrors() {
		attributeFiltersList = attributeFiltersList.map((f) => {
			return { ...f, error: '' };
		});
	}

	/**
	 * @param {{ value: string[], type: string }} item
	 * @returns {Array<string | number | boolean>}
	 */
	export function getTypedAttributeValue(item) {
		switch (item.type) {
			case 'string':
				return item.value;
			case 'number':
				return item.value.map((v) => parseFloat(v));
			case 'boolean':
				return item.value.map((v) => v.toLowerCase() === 'true');
			default:
				throw new Error(`Unsupported type: ${item.type}`);
		}
	}

	async function addAttributeFilter() {
		const item = { key: '', value: [], type: 'string', error: '' };
		attributeFiltersList = [...attributeFiltersList, item];
		// Set focus to last key input
		await tick();
		const allKeyInputs = document.querySelectorAll('.attribute-key');
		const lastKeyInput = /**@type {HTMLInputElement}*/ (allKeyInputs[allKeyInputs.length - 1]);
		lastKeyInput.focus();
	}

	async function addTypeFilter() {
		const item = { key: '', value: false, error: '' };
		typeFiltersList = [...typeFiltersList, item];
		// Set focus to last key input
		await tick();
		const allKeyInputs = document.querySelectorAll('.type-key');
		const lastKeyInput = /**@type {HTMLInputElement}*/ (allKeyInputs[allKeyInputs.length - 1]);
		lastKeyInput.focus();
	}

	/**
	 * @param {number} index
	 */
	function removeAttribute(index) {
		attributeFiltersList = attributeFiltersList.filter((_, i) => i !== index);
	}

	/**
	 * @param {number} index
	 */
	function removeType(index) {
		typeFiltersList = typeFiltersList.filter((_, i) => i !== index);
	}

	$: selectableAttributeKeys = Object.keys(existingAttributes).filter(
		(k) => attributeFiltersList.filter((af) => af.key === k).length === 0
	);

	$: selectableTypeKeys = existingTypes.filter(
		(k) => typeFiltersList.filter((tf) => tf.key === k).length === 0
	);
</script>

{#if attributeFiltersList.length > 0}
	<h5>Attribute filters</h5>
{/if}
{#key existingAttributes}
	{#each attributeFiltersList as field, index}
		<div class="input-group mb-3" class:has-validation={field.error}>
			{#key field.key}
				<AttributeFilterSelector
					bind:field
					{existingAttributes}
					{selectableAttributeKeys}
					{index}
				/>
			{/key}
			<button
				class="btn btn-outline-danger"
				type="button"
				on:click={() => removeAttribute(index)}
				aria-label="Remove attribute filter"
			>
				<i class="bi bi-trash" />
			</button>
			{#if field.error}
				<div class="invalid-feedback">{field.error}</div>
			{/if}
		</div>
	{/each}
{/key}

{#if typeFiltersList.length > 0}
	<h5>Type filters</h5>
{/if}
{#each typeFiltersList as field, index}
	<div class="row">
		<div class="col-lg-8">
			<div class="input-group mb-3" class:has-validation={field.error}>
				{#if field.key}
					<select
						class="form-select form-select-sm type-key"
						bind:value={field.key}
						class:is-invalid={field.error}
						disabled={true}
					>
						<option>{field.key}</option>
					</select>
				{:else}
					<select
						class="form-select form-select-sm type-key"
						bind:value={field.key}
						class:is-invalid={field.error}
					>
						<option value="">Select...</option>
						{#each selectableTypeKeys as key}
							<option>{key}</option>
						{/each}
					</select>
				{/if}
				<div class="input-group-text">
					<div class="form-check form-switch">
						<input
							id="type-{index}"
							class="form-check-input"
							type="checkbox"
							bind:checked={field.value}
							role="switch"
							aria-label="Value for {field.key}"
						/>
					</div>
				</div>
				<button
					class="btn btn-outline-danger"
					type="button"
					on:click={() => removeType(index)}
					aria-label="Remove type filter"
				>
					<i class="bi bi-trash" />
				</button>
				{#if field.error}
					<div class="invalid-feedback">{field.error}</div>
				{/if}
			</div>
		</div>
	</div>
{/each}

<div class="row mb-3">
	<div class="col-12">
		<button
			class="btn btn-outline-primary"
			type="button"
			on:click={addAttributeFilter}
			disabled={selectableAttributeKeys.length === 0}
		>
			Add attribute filter
		</button>
		<button
			class="btn btn-outline-primary"
			type="button"
			on:click={addTypeFilter}
			disabled={selectableTypeKeys.length === 0}
		>
			Add type filter
		</button>
	</div>
</div>
