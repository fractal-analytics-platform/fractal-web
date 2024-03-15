<script>
	import { page } from '$app/stores';
	import { AlertError } from '$lib/common/errors';
	import { tick } from 'svelte';
	import Modal from '../../common/Modal.svelte';

	/** @type {(dataset: import('$lib/types-v2').DatasetV2) => void} */
	export let createDatasetCallback;
	/** @type {(dataset: import('$lib/types-v2').DatasetV2) => void} */
	export let updateDatasetCallback;

	/** @type {Modal} */
	let modal;

	/** @type {number|null} */
	let datasetId = null;
	let datasetName = '';
	let zarrDir = '';
	let readonly = false;
	/** @type {Array<{ key: string, value: string, type: string, error: string}>} */
	let filters = [];
	let submitted = false;
	let saving = false;
	let creatingDataset = false;

	async function addFilter() {
		const filter = { key: '', value: '', type: 'string', error: '' };
		filters = [...filters, filter];
		// Set focus to last filter key input
		await tick();
		const allKeyInputs = document.querySelectorAll('.filter-key');
		const lastKeyInput = /**@type {HTMLInputElement}*/ (allKeyInputs[allKeyInputs.length - 1]);
		lastKeyInput.focus();
	}

	/**
	 * @param {number} index
	 */
	function removeFilter(index) {
		filters = filters.filter((_, i) => i !== index);
	}

	export function openForCreate() {
		datasetId = null;
		datasetName = '';
		zarrDir = '';
		readonly = false;
		filters = [];
		submitted = false;
		creatingDataset = false;
		modal.show();
	}

	export function openForEdit(/** @type {import('$lib/types-v2').DatasetV2} */ dataset) {
		datasetId = dataset.id;
		datasetName = dataset.name;
		zarrDir = dataset.zarr_dir;
		readonly = dataset.read_only;
		filters = Object.entries(dataset.filters).map(([k, v]) => {
			return { key: k, value: v.toString(), type: typeof v, error: '' };
		});
		submitted = false;
		creatingDataset = false;
		modal.show();
	}

	async function handleSave() {
		// reset filters errors
		filters = filters.map((f) => {
			return { ...f, error: '' };
		});

		submitted = true;
		modal.hideErrorAlert();
		if (!fieldsAreValid()) {
			return;
		}

		saving = true;
		await save();
		saving = false;
	}

	async function save() {
		try {
			if (datasetId === null) {
				creatingDataset = true;
				const newDataset = await callCreateDataset();
				datasetId = newDataset.id;
				createDatasetCallback(newDataset);
			} else {
				creatingDataset = false;
				const updatedDataset = await callUpdateDataset();
				updateDatasetCallback(updatedDataset);
			}
		} catch (err) {
			modal.displayErrorAlert(err);
			return;
		}
		modal.hide();
	}

	/**
	 * @returns {Promise<import('$lib/types-v2').DatasetV2>}
	 */
	async function callCreateDataset() {
		const projectId = $page.params.projectId;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(`/api/v2/project/${projectId}/dataset`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: JSON.stringify({
				name: datasetName,
				read_only: readonly,
				zarr_dir: zarrDir,
				filters: getDatasetFilters()
			})
		});
		const result = await response.json();
		if (!response.ok) {
			console.log('Dataset creation failed', result);
			throw new AlertError(result);
		}
		return result;
	}

	/**
	 * @returns {Promise<import('$lib/types-v2').DatasetV2>}
	 */
	async function callUpdateDataset() {
		const projectId = $page.params.projectId;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(`/api/v2/project/${projectId}/dataset/${datasetId}`, {
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: JSON.stringify({
				name: datasetName,
				read_only: readonly,
				zarr_dir: zarrDir,
				filters: getDatasetFilters()
			})
		});
		const result = await response.json();
		if (!response.ok) {
			console.log('Dataset update failed', result);
			throw new AlertError(result);
		}
		return result;
	}

	function getDatasetFilters() {
		return Object.fromEntries(
			filters.map((f) => {
				return [f.key, getTypedValue(f)];
			})
		);
	}

	/**
	 * @param {{ value: string, type: string }} filter
	 * @returns {string | number | boolean}
	 */
	function getTypedValue(filter) {
		switch (filter.type) {
			case 'string':
				return filter.value;
			case 'number':
				return parseFloat(filter.value);
			case 'boolean':
				return filter.value === 'true';
			default:
				throw new Error(`Unsupported type: ${filter.type}`);
		}
	}

	function fieldsAreValid() {
		let validFilters = true;
		const keys = [];
		for (const filter of filters) {
			if (!filter.key) {
				filter.error = 'Key is required';
				validFilters = false;
				continue;
			}
			if (!filter.value) {
				filter.error = 'Value is required';
				validFilters = false;
				continue;
			}
			if (filter.type === 'boolean' && filter.value !== 'true' && filter.value !== 'false') {
				filter.error = 'Invalid boolean value: use "true" or "false"';
				validFilters = false;
				continue;
			}
			if (filter.type === 'number' && !filter.value.match(/^\d+\.*\d*$/)) {
				filter.error = 'Invalid number';
				validFilters = false;
				continue;
			}
			if (keys.includes(filter.key)) {
				filter.error = 'Duplicated key';
				validFilters = false;
				continue;
			} else {
				keys.push(filter.key);
			}
		}
		// Trigger filters update
		filters = filters;
		return validFilters && !!datasetName.trim() && !!zarrDir.trim();
	}
</script>

<Modal id="createUpdateDatasetModal" bind:this={modal} size="lg" centered={true}>
	<svelte:fragment slot="header">
		<h4 class="modal-title">
			{datasetId === null ? 'Create new dataset' : 'Edit dataset ' + datasetName}
		</h4>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<span id="errorAlert-createUpdateDatasetModal" />
		<form
			class="row needs-validation"
			novalidate
			on:submit|preventDefault={handleSave}
			id="create-update-dataset-form"
		>
			<div class="col">
				<div class="row mb-3">
					<label for="datasetName" class="col-2 col-form-label text-end">Dataset Name</label>
					<div class="col-10">
						<input
							id="datasetName"
							type="text"
							bind:value={datasetName}
							class="form-control"
							class:is-invalid={submitted && !datasetName}
						/>
						{#if submitted && !datasetName}
							<div class="invalid-feedback">Required field</div>
						{/if}
					</div>
				</div>
				<div class="row mb-3">
					<label for="zarrDir" class="col-2 col-form-label text-end">Zarr dir</label>
					<div class="col-10">
						<input
							id="zarrDir"
							type="text"
							bind:value={zarrDir}
							class="form-control"
							class:is-invalid={submitted && !zarrDir}
						/>
						{#if submitted && !zarrDir}
							<div class="invalid-feedback">Required field</div>
						{/if}
					</div>
				</div>
				<div class="row mb-3">
					<div class="col-10 offset-2">
						<div class="form-check">
							<input
								class="form-check-input"
								type="checkbox"
								id="readonly"
								bind:checked={readonly}
							/>
							<label class="form-check-label" for="readonly">Is readonly</label>
						</div>
					</div>
				</div>
			</div>
			{#if filters.length > 0}
				<h5>Filters</h5>
			{/if}
			{#each filters as filter, index}
				<div class="input-group mb-3" class:has-validation={filter.error}>
					<input
						type="text"
						class="form-control filter-key"
						placeholder="Key"
						bind:value={filter.key}
						class:is-invalid={filter.error}
					/>
					<input
						type="text"
						class="form-control"
						class:is-invalid={filter.error}
						placeholder="Value"
						bind:value={filter.value}
					/>
					<select class="form-control" bind:value={filter.type} class:is-invalid={filter.error}>
						<option value="string">String</option>
						<option value="number">Number</option>
						<option value="boolean">Boolean</option>
					</select>
					<button
						class="btn btn-outline-danger"
						type="button"
						on:click={() => removeFilter(index)}
						aria-label="Remove filter"
					>
						<i class="bi bi-trash" />
					</button>
					{#if filter.error}
						<div class="invalid-feedback">{filter.error}</div>
					{/if}
				</div>
			{/each}
			<div class="row mb-3">
				<div class="col-12">
					<button class="btn btn-outline-primary" type="button" on:click={addFilter}>
						Add filter
					</button>
				</div>
			</div>
		</form>
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<button class="btn btn-primary" form="create-update-dataset-form" disabled={saving}>
			{#if saving}
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
			{/if}
			Save
		</button>
		<button class="btn btn-secondary" data-bs-dismiss="modal" type="button">Cancel</button>
	</svelte:fragment>
</Modal>
