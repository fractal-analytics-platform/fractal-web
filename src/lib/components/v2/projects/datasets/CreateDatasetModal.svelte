<script>
	import { page } from '$app/stores';
	import { AlertError } from '$lib/common/errors';
	import Modal from '../../../common/Modal.svelte';
	import AttributesTypesForm from './AttributesTypesForm.svelte';

	/** @type {(dataset: import('$lib/types-v2').DatasetV2) => void} */
	export let createDatasetCallback;

	/** @type {Modal} */
	let modal;

	/** @type {'new'|'import'} */
	let mode = 'new';
	let datasetName = '';
	let zarrDir = '';
	let submitted = false;
	let saving = false;

	/** @type {FileList|null} */
	let files = null;
	/** @type {HTMLInputElement|undefined} */
	let fileInput;
	let fileError = '';

	/** @type {AttributesTypesForm} */
	let filtersCreationForm;

	function onOpen() {
		mode = 'new';
		datasetName = '';
		zarrDir = '';
		filtersCreationForm.init({}, {});
		submitted = false;
		files = null;
		if (fileInput) {
			fileInput.value = '';
		}
		fileError = '';
	}

	async function handleSave() {
		filtersCreationForm.resetErrors();

		submitted = true;
		modal.hideErrorAlert();
		if (!fieldsAreValid()) {
			return;
		}

		saving = true;
		try {
			const newDataset = await callCreateDataset();
			createDatasetCallback(newDataset);
		} catch (err) {
			modal.displayErrorAlert(err);
			return;
		} finally {
			saving = false;
		}
		modal.hide();
	}

	async function handleImport() {
		modal.hideErrorAlert();

		if (files === null || files.length === 0) {
			fileError = 'A file is required';
			return;
		}

		const datasetFile = /** @type {FileList}*/ (files)[0];

		saving = true;
		let workflowFileContent;
		try {
			workflowFileContent = await datasetFile.text();
		} catch {
			saving = false;
			fileError = 'Unable to read dataset file';
			return;
		}

		let datasetData;
		try {
			datasetData = JSON.parse(workflowFileContent);
		} catch {
			saving = false;
			fileError = 'The selected file is not a valid JSON file';
			return;
		}

		if (datasetName.trim()) {
			console.log(`Overriding workflow name from ${datasetData.name} to ${datasetName.trim()}`);
			datasetData.name = datasetName.trim();
		}

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(`/api/v2/project/${$page.params.projectId}/dataset/import`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: JSON.stringify(datasetData)
		});

		const result = await response.json();
		saving = false;
		if (!response.ok) {
			modal.displayErrorAlert(result);
			return;
		}

		createDatasetCallback(result);
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
		<div class="row">
			<div class="col-10">
				<div class="form-check form-check-inline mb-3">
					<input
						class="form-check-input"
						type="radio"
						name="createDatasetMode"
						id="createDatasetModeNew"
						value="new"
						bind:group={mode}
					/>
					<label class="form-check-label" for="createDatasetModeNew">Create new</label>
				</div>
				<div class="form-check form-check-inline mb-3">
					<input
						class="form-check-input"
						type="radio"
						name="createDatasetMode"
						id="createDatasetModeImport"
						value="import"
						bind:group={mode}
					/>
					<label class="form-check-label" for="createDatasetModeImport">Import from file</label>
				</div>
			</div>
		</div>
		{#if mode === 'new'}
			<form
				class="row needs-validation"
				novalidate
				on:submit|preventDefault={handleSave}
				id="create-new-dataset-form"
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
								class:is-invalid={submitted && !datasetName.trim()}
							/>
							{#if submitted && !datasetName.trim()}
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
				<AttributesTypesForm bind:this={filtersCreationForm} />
			</form>
		{:else}
			<form
				on:submit|preventDefault={handleImport}
				class="row needs-validation"
				id="import-dataset-form"
				novalidate
			>
				<div class="col">
					<div class="row mb-3">
						<label for="datasetName" class="col-2 col-form-label text-end">Dataset Name</label>
						<div class="col-10">
							<input id="datasetName" type="text" bind:value={datasetName} class="form-control" />
						</div>
					</div>
				</div>
				<div class="mb-3">
					<label for="datasetFile" class="form-label">Select dataset file</label>
					<input
						class="form-control"
						accept="application/json"
						type="file"
						name="datasetFile"
						id="datasetFile"
						bind:this={fileInput}
						bind:files
						class:is-invalid={fileError}
					/>
					{#if fileError}
						<div class="invalid-feedback">{fileError}</div>
					{/if}
				</div>
			</form>
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="footer">
		{#if mode === 'new'}
			<button class="btn btn-primary" form="create-new-dataset-form" disabled={saving}>
				{#if saving}
					<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
				{/if}
				Save
			</button>
		{:else}
			<button class="btn btn-primary" form="import-dataset-form" disabled={saving}>
				{#if saving}
					<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
				{/if}
				Import
			</button>
		{/if}
		<button class="btn btn-secondary" data-bs-dismiss="modal" type="button">Cancel</button>
	</svelte:fragment>
</Modal>
