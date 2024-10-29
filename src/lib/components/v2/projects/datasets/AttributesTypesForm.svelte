<script>
	import { objectChanged } from '$lib/common/component_utilities';
	import { tick } from 'svelte';

	export let filters = true;

	/** @type {{ [key: string]: string | number | boolean }} */
	let initialAttributeFields = {};
	/** @type {{ [key: string]: boolean }} */
	let initialTypeFields = {};

	/** @type {Array<{ key: string, value: string, type: string, error: string }>} */
	let attributeFields = [];
	/** @type {Array<{ key: string, value: boolean, error: string }>} */
	let typeFields = [];

	/**
	 * @param {{ [key: string]: string | number | boolean }} attributes
	 * @param {{ [key: string]: boolean }} types
	 */
	export function init(attributes, types) {
		attributeFields = Object.entries(attributes).map(([k, v]) => {
			return { key: k, value: v.toString(), type: typeof v, error: '' };
		});
		typeFields = Object.entries(types).map(([k, v]) => {
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
			objectChanged(initialAttributeFields, getAttributes()) ||
			objectChanged(initialTypeFields, getTypes())
		);
	}

	export function discardChanges() {
		init(initialAttributeFields, initialTypeFields);
	}

	export function save() {
		initialAttributeFields = getAttributes();
		initialTypeFields = getTypes();
	}

	/**
	 * @param {string} key
	 * @param {string|number|boolean} value
	 */
	export function importAttribute(key, value) {
		const newAttribute = { key, value: value.toString(), type: typeof value, error: '' };
		if (attributeFields.filter((a) => a.key === key).length > 0) {
			attributeFields = attributeFields.map((a) => (a.key === key ? newAttribute : a));
		} else {
			attributeFields = [...attributeFields, newAttribute];
		}
	}

	/**
	 * @param {string} key
	 * @param {boolean} value
	 */
	export function importType(key, value) {
		const newType = { key, value, error: '' };
		if (typeFields.filter((t) => t.key === key).length > 0) {
			typeFields = typeFields.map((t) => (t.key === key ? newType : t));
		} else {
			typeFields = [...typeFields, newType];
		}
	}

	/**
	 * @returns {{ [key: string]: string | number | boolean }}
	 */
	export function getAttributes() {
		return Object.fromEntries(
			attributeFields.map((f) => {
				return [f.key, getTypedAttributeValue(f)];
			})
		);
	}

	/**
	 * @returns {{ [key: string]: boolean }}
	 */
	export function getTypes() {
		return Object.fromEntries(
			typeFields.map((f) => {
				return [f.key, f.value];
			})
		);
	}

	export function validateFields() {
		let validFields = true;
		const attributeKeys = [];
		const typesKey = [];
		for (const attributeField of attributeFields) {
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
			if (attributeField.type === 'number' && !attributeField.value.match(/^\d+\.*\d*$/)) {
				attributeField.error = 'Invalid number';
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
		for (const typeField of typeFields) {
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
		attributeFields = attributeFields;
		typeFields = typeFields;
		return validFields;
	}

	export function resetErrors() {
		attributeFields = attributeFields.map((f) => {
			return { ...f, error: '' };
		});
	}

	/**
	 * @param {{ value: string, type: string }} item
	 * @returns {string | number | boolean}
	 */
	export function getTypedAttributeValue(item) {
		switch (item.type) {
			case 'string':
				return item.value;
			case 'number':
				return parseFloat(item.value);
			case 'boolean':
				return item.value.toLowerCase() === 'true';
			default:
				throw new Error(`Unsupported type: ${item.type}`);
		}
	}

	/**
	 * @param {{ key: string, value: string, type: string, error: string }} field
	 * @param {number} index
	 */
	function fieldTypeChanged(field, index) {
		if (field.type === 'boolean') {
			if (field.value.toLowerCase() === 'true') {
				field.value = 'true';
			} else {
				field.value = 'false';
			}
		} else if (field.type !== 'number' || !field.value.match(/^\d+\.*\d*$/)) {
			field.value = '';
		}
		attributeFields = attributeFields.filter((f, i) => (i === index ? field : f));
	}

	async function addAttribute() {
		const item = { key: '', value: '', type: 'string', error: '' };
		attributeFields = [...attributeFields, item];
		// Set focus to last key input
		await tick();
		const allKeyInputs = document.querySelectorAll('.attribute-key');
		const lastKeyInput = /**@type {HTMLInputElement}*/ (allKeyInputs[allKeyInputs.length - 1]);
		lastKeyInput.focus();
	}

	async function addType() {
		const item = { key: '', value: false, error: '' };
		typeFields = [...typeFields, item];
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
		attributeFields = attributeFields.filter((_, i) => i !== index);
	}

	/**
	 * @param {number} index
	 */
	function removeType(index) {
		typeFields = typeFields.filter((_, i) => i !== index);
	}
</script>

{#if attributeFields.length > 0}
	<h5>
		{#if filters}
			Attribute filters
		{:else}
			Attributes
		{/if}
	</h5>
{/if}
{#each attributeFields as field, index}
	<div class="input-group mb-3" class:has-validation={field.error}>
		<input
			type="text"
			class="form-control attribute-key"
			placeholder="Key"
			bind:value={field.key}
			class:is-invalid={field.error}
		/>
		{#if field.type === 'boolean'}
			<select class="form-select" bind:value={field.value} aria-label="Value">
				<option value="true">True</option>
				<option value="false">False</option>
			</select>
		{:else}
			<input
				type="text"
				class="form-control"
				class:is-invalid={field.error}
				placeholder="Value"
				bind:value={field.value}
			/>
		{/if}
		<select
			class="form-select"
			bind:value={field.type}
			class:is-invalid={field.error}
			aria-label="Type"
			on:change={() => fieldTypeChanged(field, index)}
		>
			<option value="string">String</option>
			<option value="number">Number</option>
			<option value="boolean">Boolean</option>
		</select>
		<button
			class="btn btn-outline-danger"
			type="button"
			on:click={() => removeAttribute(index)}
			aria-label={filters ? 'Remove attribute filter' : 'Remove attribute'}
		>
			<i class="bi bi-trash" />
		</button>
		{#if field.error}
			<div class="invalid-feedback">{field.error}</div>
		{/if}
	</div>
{/each}

{#if typeFields.length > 0}
	<h5>
		{#if filters}
			Type filters
		{:else}
			Types
		{/if}
	</h5>
{/if}
{#each typeFields as field, index}
	<div class="row">
		<div class="col-lg-8">
			<div class="input-group mb-3" class:has-validation={field.error}>
				<input
					type="text"
					class="form-control type-key"
					placeholder="Key"
					bind:value={field.key}
					class:is-invalid={field.error}
				/>
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
					aria-label={filters ? 'Remove type filter' : 'Remove type'}
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
		<button class="btn btn-outline-primary" type="button" on:click={addAttribute}>
			{#if filters}
				Add attribute filter
			{:else}
				Add attribute
			{/if}
		</button>
		<button class="btn btn-outline-primary" type="button" on:click={addType}>
			{#if filters}
				Add type filter
			{:else}
				Add type
			{/if}
		</button>
	</div>
</div>
