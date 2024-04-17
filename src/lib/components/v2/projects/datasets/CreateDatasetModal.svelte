<script>
	import { page } from '$app/stores';
	import { AlertError } from '$lib/common/errors';
	import Modal from '../../../common/Modal.svelte';
	import FiltersCreationForm from './FiltersCreationForm.svelte';

	/** @type {(dataset: import('$lib/types-v2').DatasetV2) => void} */
	export let createDatasetCallback;

	/** @type {Modal} */
	let modal;

	let datasetName = '';
	let zarrDir = '';
	let submitted = false;
	let saving = false;
	let creatingDataset = false;

	/** @type {FiltersCreationForm} */
	let filtersCreationForm;

	function onOpen() {
		datasetName = '';
		zarrDir = '';
		filtersCreationForm.init({}, {});
		submitted = false;
		creatingDataset = false;
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
			creatingDataset = true;
			const newDataset = await callCreateDataset();
			createDatasetCallback(newDataset);
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
				zarr_dir: zarrDir,
				filters: {
					attributes: filtersCreationForm.getAttributes(),
					types: filtersCreationForm.getTypes()
				}
			})
		});
		const result = await response.json();
		if (!response.ok) {
			console.log('Dataset creation failed', result);
			throw new AlertError(result);
		}
		return result;
	}

	function fieldsAreValid() {
		const validFilters = filtersCreationForm.validateFields();
		return validFilters && !!datasetName.trim() && !!zarrDir.trim();
	}
</script>

<Modal id="createDatasetModal" bind:this={modal} size="lg" centered={true} {onOpen}>
	<svelte:fragment slot="header">
		<h4 class="modal-title">Create new dataset</h4>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<span id="errorAlert-createDatasetModal" />
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
