<script>
	import { objectChanged } from '$lib/common/component_utilities';
	import { tick } from 'svelte';

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
		let validFilters = true;
		const keys = [];
		for (const attributeField of attributeFields) {
			if (!attributeField.key) {
				attributeField.error = 'Key is required';
				validFilters = false;
				continue;
			}
			if (!attributeField.value) {
				attributeField.error = 'Value is required';
				validFilters = false;
				continue;
			}
			if (attributeField.type === 'number' && !attributeField.value.match(/^\d+\.*\d*$/)) {
				attributeField.error = 'Invalid number';
				validFilters = false;
				continue;
			}
			if (keys.includes(attributeField.key)) {
				attributeField.error = 'Duplicated key';
				validFilters = false;
				continue;
			} else {
				keys.push(attributeField.key);
			}
		}
		for (const typeField of typeFields) {
			if (!typeField.key) {
				typeField.error = 'Key is required';
				validFilters = false;
				continue;
			}
			if (keys.includes(typeField.key)) {
				typeField.error = 'Duplicated key';
				validFilters = false;
				continue;
			} else {
				keys.push(typeField.key);
			}
		}
		// Trigger filters update
		attributeFields = attributeFields;
		typeFields = typeFields;
		return validFilters;
	}

	export function resetErrors() {
		attributeFields = attributeFields.map((f) => {
			return { ...f, error: '' };
		});
	}

	/**
	 * @param {{ value: string, type: string }} filter
	 * @returns {string | number | boolean}
	 */
	export function getTypedAttributeValue(filter) {
		switch (filter.type) {
			case 'string':
				return filter.value;
			case 'number':
				return parseFloat(filter.value);
			case 'boolean':
				return filter.value.toLowerCase() === 'true';
			default:
				throw new Error(`Unsupported type: ${filter.type}`);
		}
	}

	/**
	 * @param {{ key: string, value: string, type: string, error: string }} field
	 */
	function fieldTypeChanged(field) {
		if (field.type === 'boolean') {
			field.value = 'true';
		} else if (field.type !== 'number' || !field.value.match(/^\d+\.*\d*$/)) {
			field.value = '';
		}
	}

	async function addAttributeFilter() {
		const filter = { key: '', value: '', type: 'string', error: '' };
		attributeFields = [...attributeFields, filter];
		// Set focus to last filter key input
		await tick();
		const allKeyInputs = document.querySelectorAll('.attribute-filter-key');
		const lastKeyInput = /**@type {HTMLInputElement}*/ (allKeyInputs[allKeyInputs.length - 1]);
		lastKeyInput.focus();
	}

	async function addTypeFilter() {
		const filter = { key: '', value: false, error: '' };
		typeFields = [...typeFields, filter];
		// Set focus to last filter key input
		await tick();
		const allKeyInputs = document.querySelectorAll('.type-filter-key');
		const lastKeyInput = /**@type {HTMLInputElement}*/ (allKeyInputs[allKeyInputs.length - 1]);
		lastKeyInput.focus();
	}

	/**
	 * @param {number} index
	 */
	function removeAttributeFilter(index) {
		attributeFields = attributeFields.filter((_, i) => i !== index);
	}

	/**
	 * @param {number} index
	 */
	function removeTypeFilter(index) {
		typeFields = typeFields.filter((_, i) => i !== index);
	}
</script>

{#if attributeFields.length > 0}
	<h5>Attribute filters</h5>
{/if}
{#each attributeFields as field, index}
	<div class="input-group mb-3" class:has-validation={field.error}>
		<input
			type="text"
			class="form-control attribute-filter-key"
			placeholder="Key"
			bind:value={field.key}
			class:is-invalid={field.error}
		/>
		{#if field.type === 'boolean'}
			<select class="form-control" bind:value={field.value} aria-label="Value">
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
			class="form-control"
			bind:value={field.type}
			class:is-invalid={field.error}
			aria-label="Type"
			on:change={() => fieldTypeChanged(field)}
		>
			<option value="string">String</option>
			<option value="number">Number</option>
			<option value="boolean">Boolean</option>
		</select>
		<button
			class="btn btn-outline-danger"
			type="button"
			on:click={() => removeAttributeFilter(index)}
			aria-label="Remove attribute filter"
		>
			<i class="bi bi-trash" />
		</button>
		{#if field.error}
			<div class="invalid-feedback">{field.error}</div>
		{/if}
	</div>
{/each}

{#if typeFields.length > 0}
	<h5>Type filters</h5>
{/if}
{#each typeFields as field, index}
	<div class="row">
		<div class="col-lg-8">
			<div class="input-group mb-3" class:has-validation={field.error}>
				<input
					type="text"
					class="form-control type-filter-key"
					placeholder="Key"
					bind:value={field.key}
					class:is-invalid={field.error}
				/>
				<div class="input-group-text">
					<label>
						<input
							class="form-check-input me-1"
							type="checkbox"
							bind:checked={field.value}
							aria-label="Value for {field.key}"
						/>
						{field.value}
					</label>
				</div>
				<button
					class="btn btn-outline-danger"
					type="button"
					on:click={() => removeTypeFilter(index)}
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
		<button class="btn btn-outline-primary" type="button" on:click={addAttributeFilter}>
			Add attribute filter
		</button>
		<button class="btn btn-outline-primary" type="button" on:click={addTypeFilter}>
			Add type filter
		</button>
	</div>
</div>
