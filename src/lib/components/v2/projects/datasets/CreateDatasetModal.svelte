<script>
	import { page } from '$app/state';
	import { FormErrorHandler } from '$lib/common/errors';
	import { onMount } from 'svelte';
	import Modal from '../../../common/Modal.svelte';
	import { normalizePayload } from 'fractal-components';

	/**
	 * @typedef {Object} Props
	 * @property {(dataset: import('fractal-components/types/api').DatasetV2) => void} createDatasetCallback
	 */

	/** @type {Props} */
	let { createDatasetCallback } = $props();

	/** @type {Modal|undefined} */
	let modal = $state();

	/** @type {'new'|'import'} */
	let mode = $state('new');
	let datasetName = $state('');
	/** @type {string|null} */
	let projectDir = $state(null);
	let zarrDir = $state('');
	let submitted = $state(false);
	let saving = $state(false);

	/** @type {FileList|null} */
	let files = $state(null);
	/** @type {HTMLInputElement|undefined} */
	let fileInput = $state();
	let fileError = $state('');

	const formErrorHandler = new FormErrorHandler('errorAlert-createDatasetModal', [
		'name',
		'zarr_dir'
	]);

	const validationErrors = formErrorHandler.getValidationErrorStore();

	function onOpen() {
		mode = 'new';
		datasetName = '';
		zarrDir = '';
		submitted = false;
		files = null;
		if (fileInput) {
			fileInput.value = '';
		}
		fileError = '';
		formErrorHandler.clearErrors();
	}

	async function handleSave() {
		submitted = true;
		modal?.hideErrorAlert();
		if (!fieldsAreValid()) {
			return;
		}

		saving = true;
		const newDataset = await callCreateDataset();
		saving = false;
		if (newDataset === null) {
			return;
		}
		createDatasetCallback(newDataset);
		modal?.hide();
	}

	async function handleImport() {
		modal?.hideErrorAlert();

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

		const response = await fetch(`/api/v2/project/${page.params.projectId}/dataset/import`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: normalizePayload(datasetData)
		});

		const result = await response.json();
		saving = false;
		if (!response.ok) {
			modal?.displayErrorAlert(result);
			return;
		}

		createDatasetCallback(result);
		modal?.hide();
	}

	/**
	 * @returns {Promise<import('fractal-components/types/api').DatasetV2|null>}
	 */
	async function callCreateDataset() {
		const projectId = page.params.projectId;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const body = {
			name: datasetName
		};
		if (zarrDir) {
			body.zarr_dir = zarrDir;
		}
		const response = await fetch(`/api/v2/project/${projectId}/dataset`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: normalizePayload(body)
		});
		if (!response.ok) {
			console.log('Dataset creation failed');
			await formErrorHandler.handleErrorResponse(response);
			return null;
		}
		return await response.json();
	}

	function fieldsAreValid() {
		return !!datasetName.trim() && (projectDir !== null || !!zarrDir.trim());
	}

	onMount(async () => {
		await loadProjectDir();
	});

	async function loadProjectDir() {
		const response = await fetch('/api/auth/current-user/settings');
		if (!response.ok) {
			return;
		}
		/** @type {import('fractal-components/types/api').UserSettings} */
		const result = await response.json();
		projectDir = result.project_dir;
	}
</script>

<Modal id="createDatasetModal" bind:this={modal} size="lg" centered={true} {onOpen}>
	{#snippet header()}
		<h4 class="modal-title">Create new dataset</h4>
	{/snippet}
	{#snippet body()}
		<span id="errorAlert-createDatasetModal"></span>
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
				onsubmit={(e) => {
					e.preventDefault();
					handleSave();
				}}
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
								class:is-invalid={submitted && (!datasetName.trim() || $validationErrors['name'])}
							/>
							{#if submitted && !datasetName.trim()}
								<div class="invalid-feedback">
									{#if !datasetName.trim()}
										Required field
									{:else}
										{$validationErrors['name']}
									{/if}
								</div>
							{/if}
						</div>
					</div>
					{#if projectDir === null}
						<div class="row mb-3">
							<label for="zarrDir" class="col-2 col-form-label text-end">Zarr dir</label>
							<div class="col-10">
								<input
									id="zarrDir"
									type="text"
									bind:value={zarrDir}
									class="form-control"
									class:is-invalid={submitted && (!zarrDir || $validationErrors['zarr_dir'])}
								/>
								<div class="form-text">The main folder for OME-Zarrs of this dataset.</div>
								{#if submitted && (!zarrDir || $validationErrors['zarr_dir'])}
									<div class="invalid-feedback">
										{#if !zarrDir}
											Required field
										{:else}
											{$validationErrors['zarr_dir']}
										{/if}
									</div>
								{/if}
							</div>
						</div>
					{:else}
						<div class="row mb-3">
							<div class="accordion" id="zarrDirAccordion">
								<div class="accordion-item">
									<h2 class="accordion-header">
										<button
											class="accordion-button collapsed"
											type="button"
											data-bs-toggle="collapse"
											data-bs-target="#zarrDirCollapse"
											aria-expanded="false"
											aria-controls="zarrDirCollapse"
										>
											Advanced options
										</button>
									</h2>
									<div
										id="zarrDirCollapse"
										class="accordion-collapse collapse"
										data-bs-parent="#zarrDirAccordion"
									>
										<div class="accordion-body">
											<div class="row">
												<label for="zarrDir" class="col-2 col-form-label text-end">Zarr dir</label>
												<div class="col-10">
													<input
														id="zarrDir"
														type="text"
														bind:value={zarrDir}
														class="form-control"
														class:is-invalid={submitted && $validationErrors['zarr_dir']}
													/>
													<div class="form-text">
														The main folder for OME-Zarrs of this dataset. If not set, a default
														subfolder of <code>{projectDir}</code> will be used.
													</div>
													{#if submitted && $validationErrors['zarr_dir']}
														<div class="invalid-feedback">
															{$validationErrors['zarr_dir']}
														</div>
													{/if}
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</form>
		{:else}
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleImport();
				}}
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
	{/snippet}
	{#snippet footer()}
		{#if mode === 'new'}
			<button class="btn btn-primary" form="create-new-dataset-form" disabled={saving}>
				{#if saving}
					<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
				{/if}
				Save
			</button>
		{:else}
			<button class="btn btn-primary" form="import-dataset-form" disabled={saving}>
				{#if saving}
					<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
				{/if}
				Import
			</button>
		{/if}
		<button class="btn btn-secondary" data-bs-dismiss="modal" type="button">Cancel</button>
	{/snippet}
</Modal>
