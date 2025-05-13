<script>
	import { objectChanged } from '$lib/common/component_utilities';
	import { tick } from 'svelte';

	
	/**
	 * @typedef {Object} Props
	 * @property {import("fractal-components/types/api").TaskV2} task
	 */

	/** @type {Props} */
	let { task } = $props();

	/** @type {{ [key: string]: boolean }} */
	let initialTypeFields = {};

	/** @type {Array<{ key: string, value: boolean, error: string }>} */
	let typeFields = $state([]);

	/**
	 * @param {{ [key: string]: boolean }} types
	 */
	export function init(types) {
		typeFields = Object.entries(types).map(([k, v]) => {
			return { key: k, value: v, error: '' };
		});
		initialTypeFields = getTypes();
	}

	/**
	 * @returns {boolean}
	 */
	export function hasUnsavedChanges() {
		return objectChanged(initialTypeFields, getTypes());
	}

	export function discardChanges() {
		init(initialTypeFields);
	}

	export function save() {
		initialTypeFields = getTypes();
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
		const typesKey = [];
		for (const typeField of typeFields) {
			if (!typeField.key) {
				typeField.error = 'Key is required';
				validFields = false;
				continue;
			}
			if (Object.keys(task.input_types).includes(typeField.key)) {
				typeField.error = 'Filter already present in task.input_types';
				validFields = false;
				continue;
			}
			if (typesKey.includes(typeField.key)) {
				typeField.error = 'Duplicated key';
				validFields = false;
				continue;
			} else {
				typeField.error = '';
				typesKey.push(typeField.key);
			}
		}
		// Trigger items update
		typeFields = typeFields;
		return validFields;
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

	async function addTypeFilter() {
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
	function removeType(index) {
		typeFields = typeFields.filter((_, i) => i !== index);
	}
</script>

{#if typeFields.length > 0}
	<h5>Type filters</h5>
{/if}
{#each typeFields as field, index (index)}
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
					onclick={() => removeType(index)}
					aria-label="Remove type filter"
				>
					<i class="bi bi-trash"></i>
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
		<button class="btn btn-outline-primary" type="button" onclick={addTypeFilter}>
			Add type filter
		</button>
	</div>
</div>
