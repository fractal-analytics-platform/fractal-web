<script>
	import { page } from '$app/stores';
	import { AlertError } from '$lib/common/errors';
	import { onMount, tick } from 'svelte';
	import Modal from '../common/Modal.svelte';

	/** @type {(dataset: (import('$lib/types').Dataset)) => void} */
	export let createDatasetCallback;
	/** @type {(dataset: Omit<(import('$lib/types').Dataset), 'project'>) => void} */
	export let updateDatasetCallback;

	/** @type {Modal} */
	let modal;

	/** @type {number|null} */
	let datasetId = null;
	let datasetName = '';
	/** @type {'standard'|'custom'} */
	let datasetTypeOption = 'standard';
	let datasetType = '';
	let customDatasetType = '';
	let readonly = false;
	/** @type {Array<{ id: number | null, path: string, editing: boolean, error: string }>} */
	let resources = [getNewResource()];
	let submitted = false;
	let saving = false;
	let creatingDataset = false;

	// Used for the update
	/** @type {import('$lib/types').Dataset} */
	let originalDataset;

	let datasetTypes = [];

	onMount(async () => {
		await loadDatasetTypes();
	});

	async function loadDatasetTypes() {
		const response = await fetch(`/api/v1/task`, {
			method: 'GET',
			credentials: 'include'
		});
		if (response.ok) {
			const types = new Set();
			/** @type {import('$lib/types').Task[]} */
			const tasks = await response.json();
			for (const task of tasks) {
				if (task.owner === null) {
					types.add(task.input_type);
					types.add(task.output_type);
				}
			}
			types.delete('Any');
			datasetTypes = Array.from(types);
		} else {
			console.error('Unable to retrieve dataset types', await response.json());
		}
	}

	async function addResource() {
		resources = [...resources, getNewResource()];
		// Set focus to last resource input
		await tick();
		const allInputs = document.querySelectorAll('#resources input[type="text"]');
		const lastInput = /**@type {HTMLInputElement}*/ (allInputs[allInputs.length - 1]);
		lastInput.focus();
	}

	export function openForCreate() {
		datasetId = null;
		datasetName = '';
		datasetTypeOption = 'standard';
		datasetType = '';
		customDatasetType = '';
		readonly = false;
		resources = [getNewResource()];
		submitted = false;
		creatingDataset = false;
		modal.show();
	}

	function getNewResource() {
		return {
			id: /** @type {number | null} */ null,
			path: '',
			editing: true,
			error: ''
		};
	}

	export function openForEdit(/** @type {import('$lib/types').Dataset} */ dataset) {
		originalDataset = dataset;
		datasetId = dataset.id;
		datasetName = dataset.name;
		if (!dataset.type || datasetTypes.indexOf(dataset.type) !== -1) {
			datasetTypeOption = 'standard';
			datasetType = dataset.type || '';
			customDatasetType = '';
		} else {
			datasetTypeOption = 'custom';
			datasetType = '';
			customDatasetType = dataset.type || '';
		}
		readonly = dataset.read_only;
		resources = dataset.resource_list.map((r) => {
			return { id: r.id, path: r.path, editing: false, error: '' };
		});
		submitted = false;
		creatingDataset = false;
		modal.show();
	}

	async function handleSave() {
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
		// reset resources errors
		resources = resources.map((r) => {
			return { ...r, error: '' };
		});

		try {
			if (datasetId === null) {
				creatingDataset = true;
				originalDataset = await callCreateDataset();
				datasetId = originalDataset.id;
				createDatasetCallback(originalDataset);
			} else {
				creatingDataset = false;
				originalDataset = await callUpdateDataset();
				updateDatasetCallback(originalDataset);
			}
		} catch (err) {
			modal.displayErrorAlert(err);
			return;
		}

		for (let i = 0; i < resources.length; i++) {
			const saved = await handleSaveResource(i);
			if (!saved) {
				return;
			}
		}
		modal.hide();
	}

	async function callCreateDataset() {
		const projectId = $page.params.projectId;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(`/api/v1/project/${projectId}/dataset`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: JSON.stringify({
				name: datasetName,
				type: getDatasetType(),
				read_only: readonly,
				meta: {}
			})
		});
		const result = await response.json();
		if (!response.ok) {
			console.log('Dataset creation failed', result);
			throw new AlertError(result);
		}
		return result;
	}

	async function callUpdateDataset() {
		const projectId = $page.params.projectId;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(`/api/v1/project/${projectId}/dataset/${datasetId}`, {
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: JSON.stringify({
				name: datasetName,
				type: getDatasetType(),
				read_only: readonly,
				meta: {}
			})
		});
		const result = await response.json();
		if (!response.ok) {
			console.log('Dataset update failed', result);
			throw new AlertError(result);
		}
		return result;
	}

	/** @returns {Promise<boolean>} */
	async function handleSaveResource(/** @type {number} */ index) {
		submitted = true;
		modal.hideErrorAlert();

		const resource = resources[index];
		resource.error = '';
		if (!resource.path) {
			return false;
		}

		if (datasetId === null) {
			try {
				if (!fieldsAreValid()) {
					return false;
				}
				creatingDataset = true;
				originalDataset = await callCreateDataset();
				datasetId = originalDataset.id;
				createDatasetCallback(originalDataset);
			} catch (err) {
				modal.displayErrorAlert(err);
				return false;
			}
		}

		try {
			if (resource.editing) {
				if (resource.id === null) {
					const createdResource = await callCreateResource(resource.path);
					resource.id = createdResource.id;
				} else {
					await callUpdateResource(resource.id, resource.path);
				}
			}
			setResourceEditable(index, false);
			updateDatasetCallback(getUpdatedDataset());
		} catch (err) {
			const validationMsg =
				err instanceof AlertError ? err.getSimpleValidationMessage('path') : null;
			if (validationMsg) {
				resource.error = validationMsg;
			} else {
				resource.error = 'An error happened saving the resource';
				modal.displayErrorAlert(err);
			}
		} finally {
			resources = resources.filter((r, i) => (i === index ? resource : r));
		}
		return !resource.error;
	}

	/** @returns {Promise<import('$lib/types').Resource>} */
	async function callCreateResource(/** @type {string} */ resourcePath) {
		const projectId = $page.params.projectId;

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(`/api/v1/project/${projectId}/dataset/${datasetId}/resource`, {
			method: 'POST',
			credentials: 'include',
			mode: 'cors',
			headers,
			body: JSON.stringify({
				path: resourcePath
			})
		});
		const result = await response.json();
		if (!response.ok) {
			console.log('Dataset resource creation failed', result);
			throw new AlertError(result, response.status);
		}
		return result;
	}

	async function callUpdateResource(
		/** @type {number} */ resourceId,
		/** @type {string} */ resourcePath
	) {
		const projectId = $page.params.projectId;

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(
			`/api/v1/project/${projectId}/dataset/${datasetId}/resource/${resourceId}`,
			{
				method: 'PATCH',
				credentials: 'include',
				mode: 'cors',
				headers,
				body: JSON.stringify({
					path: resourcePath
				})
			}
		);
		const result = await response.json();
		if (!response.ok) {
			console.log('Dataset resource creation failed', result);
			throw new AlertError(result);
		}
	}

	async function handleDeleteResource(/** @type {number} */ index) {
		const resourceId = resources[index].id;
		if (resourceId !== null) {
			try {
				callDeleteResource(resourceId);
				resources = resources.filter((_r, i) => i !== index);
				updateDatasetCallback(getUpdatedDataset());
			} catch (err) {
				modal.displayErrorAlert(err);
			}
		} else {
			resources = resources.filter((_r, i) => i !== index);
		}
	}

	async function callDeleteResource(/** @type {number} */ resourceId) {
		const projectId = $page.params.projectId;
		const response = await fetch(
			`/api/v1/project/${projectId}/dataset/${datasetId}/resource/${resourceId}`,
			{
				method: 'DELETE',
				credentials: 'include'
			}
		);
		if (!response.ok) {
			const result = await response.json();
			console.log('Dataset resource deletion failed', result);
			throw new AlertError(result);
		}
	}

	async function setResourceEditable(
		/** @type {number} */ index,
		/** @type {boolean} */ editing = true
	) {
		resources = resources.map((r, i) => {
			if (i === index) {
				return { ...r, editing };
			} else {
				return r;
			}
		});
		submitted = false;
		if (!editing) {
			return;
		}
		await tick();
		// Set focus on target input
		const allInputs = document.querySelectorAll('#resources input[type="text"]');
		const targetInput = /**@type {HTMLInputElement}*/ (allInputs[index]);
		targetInput.focus();
	}

	/**
	 * Creates an object for the updateDatasetCallback()
	 * @returns {Omit<import('$lib/types').Dataset, 'project'>}
	 */
	function getUpdatedDataset() {
		return {
			name: datasetName,
			type: getDatasetType(),
			meta: originalDataset.meta,
			read_only: readonly,
			id: /** @type {number} */ (datasetId),
			resource_list: resources.map((r) => {
				return /** @type {import('$lib/types').Resource} */ ({
					id: r.id,
					path: r.path,
					dataset_id: datasetId
				});
			}),
			project_id: originalDataset.project_id,
			history: []
		};
	}

	function fieldsAreValid() {
		for (const resource of resources) {
			if (!resource.path) {
				return false;
			}
		}
		return !!datasetName;
	}

	function getDatasetType() {
		if (datasetTypeOption === 'custom') {
			return customDatasetType || undefined;
		}
		return datasetType || undefined;
	}

	function handleResourceKeyDown(/** @type {KeyboardEvent} */ event, /** @type {number} */ index) {
		if (event.key === 'Enter') {
			handleSaveResource(index);
			event.preventDefault();
		}
	}
</script>

<Modal id="createUpdateDatasetModal" bind:this={modal} size="lg" centered={true}>
	<svelte:fragment slot="header">
		<h4 class="modal-title">
			{datasetId === null ? 'Create new dataset' : 'Edit dataset ' + datasetName}
		</h4>
	</svelte:fragment>
	<svelte:fragment slot="body">
		{#if creatingDataset && resources.filter((r) => r.error !== '').length > 0}
			<div class="alert alert-warning alert-dismissible fade show" role="alert">
				<span>
					<i class="bi bi-exclamation-triangle" />
					<strong>Warning</strong>: Dataset has been created but the creation of some of its
					resources failed.
				</span>
				<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" />
			</div>
		{/if}
		<span id="errorAlert-createUpdateDatasetModal" />
		<form class="row" on:submit|preventDefault={handleSave} id="create-update-dataset-form">
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
				<div class="row">
					<label for="datasetType" class="col-2 col-form-label text-end">Dataset type</label>
					<div class="col-10">
						<div class="form-check form-check-inline mt-2">
							<input
								class="form-check-input"
								type="radio"
								name="customDatasetTypeOptions"
								id="customDatasetTypeStandard"
								value="standard"
								bind:group={datasetTypeOption}
							/>
							<label class="form-check-label" for="customDatasetTypeStandard">standard</label>
						</div>
						<div class="form-check form-check-inline mt-2">
							<input
								class="form-check-input"
								type="radio"
								name="customDatasetTypeOptions"
								id="customDatasetTypeCustom"
								value="custom"
								bind:group={datasetTypeOption}
							/>
							<label class="form-check-label" for="customDatasetTypeCustom">custom</label>
						</div>
					</div>
				</div>
				<div class="row mb-3">
					<div class="col-10 offset-2">
						{#if datasetTypeOption === 'standard'}
							<select id="datasetType" bind:value={datasetType} class="form-control">
								<option value="">Select...</option>
								{#each datasetTypes as allowedType}
									<option>{allowedType}</option>
								{/each}
							</select>
						{:else}
							<input
								id="customDatasetType"
								type="text"
								bind:value={customDatasetType}
								class="form-control"
								placeholder="Your custom type"
							/>
						{/if}
					</div>
				</div>
				<div class="row mb-2">
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
				<h5>Resources</h5>
				<div id="resources">
					{#each resources as resource, i}
						<div class="row mb-3">
							<div class="col-12">
								<div class="input-group">
									<input
										type="text"
										class="form-control"
										id="resource-path-{i}"
										bind:value={resource.path}
										class:is-invalid={submitted && (!resource.path || resource.error)}
										disabled={!resource.editing}
										on:keydown={(event) => handleResourceKeyDown(event, i)}
									/>
									{#if resource.editing}
										<button
											class="btn btn-outline-primary"
											type="button"
											id="save-resource-{i}"
											on:click={() => handleSaveResource(i)}
										>
											<i class="bi bi-check2" />
										</button>
									{:else}
										<button
											class="btn btn-outline-secondary"
											type="button"
											id="save-resource-{i}"
											on:click={() => setResourceEditable(i)}
										>
											<i class="bi bi-pencil" />
										</button>
									{/if}
									{#if resources.length > 1}
										<button
											class="btn btn-outline-danger"
											type="button"
											id="remove-resource-{i}"
											on:click={() => handleDeleteResource(i)}
										>
											<i class="bi bi-trash" />
										</button>
									{/if}
									{#if submitted && !resource.path}
										<div class="invalid-feedback">Required field</div>
									{/if}
									{#if submitted && resource.error}
										<div class="invalid-feedback">{resource.error}</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
			<div class="row mb-3">
				<div class="col-12">
					<button class="btn btn-outline-primary" type="button" on:click={addResource}>
						Add resource
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
