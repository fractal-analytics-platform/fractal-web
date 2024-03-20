<script>
	import { page } from '$app/stores';
	import { AlertError } from '$lib/common/errors';
	import Modal from '../../../common/Modal.svelte';
	import FiltersCreationForm from './FiltersCreationForm.svelte';

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
	let submitted = false;
	let saving = false;
	let creatingDataset = false;

	/** @type {FiltersCreationForm} */
	let filtersCreationForm;

	export function openForCreate() {
		datasetId = null;
		datasetName = '';
		zarrDir = '';
		readonly = false;
		filtersCreationForm.init({}, {});
		submitted = false;
		creatingDataset = false;
		modal.show();
	}

	export function openForEdit(/** @type {import('$lib/types-v2').DatasetV2} */ dataset) {
		datasetId = dataset.id;
		datasetName = dataset.name;
		zarrDir = dataset.zarr_dir;
		readonly = dataset.read_only;
		filtersCreationForm.init(dataset.attribute_filters, dataset.flag_filters);
		submitted = false;
		creatingDataset = false;
		modal.show();
	}

	async function handleSave() {
		filtersCreationForm.resetErrors();

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
				attribute_filters: filtersCreationForm.getAttributes(),
				flag_filters: filtersCreationForm.getFlags()
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
				attribute_filters: filtersCreationForm.getAttributes(),
				flag_filters: filtersCreationForm.getFlags()
			})
		});
		const result = await response.json();
		if (!response.ok) {
			console.log('Dataset update failed', result);
			throw new AlertError(result);
		}
		return result;
	}

	function fieldsAreValid() {
		const validFilters = filtersCreationForm.validateFields();
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
			<FiltersCreationForm bind:this={filtersCreationForm} />
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
