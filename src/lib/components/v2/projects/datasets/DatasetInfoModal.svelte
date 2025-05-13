<script>
	import { page } from '$app/state';
	import { FormErrorHandler } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').DatasetV2} dataset
	 * @property {(dataset: import('fractal-components/types/api').DatasetV2) => void} updateDatasetCallback
	 */

	/** @type {Props} */
	let { dataset, updateDatasetCallback } = $props();

	/** @type {Modal|undefined} */
	let modal = $state();

	let editName = $state(false);
	let name = $state('');
	let editZarrDir = $state(false);
	let zarrDir = $state('');

	const formErrorHandler = new FormErrorHandler('errorAlert-datasetInfoModal', [
		'name',
		'zarr_dir'
	]);
	const validationErrors = formErrorHandler.getValidationErrorStore();

	function onOpen() {
		editName = false;
		editZarrDir = false;
		name = dataset.name;
		zarrDir = dataset.zarr_dir;
		formErrorHandler.clearErrors();
	}

	let savingName = $state(false);

	async function saveName() {
		if (!name) {
			return;
		}
		savingName = true;
		const updated = await updateDataset({ name });
		if (updated) {
			editName = false;
		}
		savingName = false;
	}

	function undoEditName() {
		editName = false;
		name = dataset.name;
	}

	let savingZarrDir = $state(false);

	async function saveZarrDir() {
		if (!zarrDir) {
			return;
		}
		formErrorHandler.clearErrors();
		savingZarrDir = true;
		const updated = await updateDataset({ zarr_dir: zarrDir });
		if (updated) {
			editZarrDir = false;
		}
		savingZarrDir = false;
	}

	function undoEditZarrDir() {
		editZarrDir = false;
		zarrDir = dataset.zarr_dir;
		formErrorHandler.removeValidationError('zarr_dir');
	}

	/**
	 * @param {object} body
	 * @returns {Promise<boolean>} true if the update was successful, false otherwise
	 */
	async function updateDataset(body) {
		const projectId = page.params.projectId;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(`/api/v2/project/${projectId}/dataset/${dataset.id}`, {
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: JSON.stringify(body)
		});
		if (response.ok) {
			const result = await response.json();
			updateDatasetCallback(result);
		} else {
			console.log('Dataset update failed');
			await formErrorHandler.handleErrorResponse(response);
		}
		return response.ok;
	}
</script>

<Modal id="datasetInfoModal" centered={true} scrollable={true} {onOpen} bind:this={modal} size="lg">
	{#snippet header()}
		<h5 class="modal-title">Dataset properties</h5>
	{/snippet}
	{#snippet body()}
		<div id="errorAlert-datasetInfoModal"></div>
		<ul class="list-group">
			<li class="list-group-item text-bg-light">
				<strong>Id</strong>
			</li>
			<li class="list-group-item">
				<span>{dataset.id}</span>
			</li>
			<li class="list-group-item text-bg-light">
				<strong>Name</strong>
			</li>
			<li class="list-group-item">
				{#if editName}
					<div class="input-group has-validation">
						<input
							type="text"
							bind:value={name}
							class="form-control"
							class:is-invalid={$validationErrors['name']}
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									saveName();
								}
							}}
						/>
						<button
							class="btn btn-outline-secondary"
							type="button"
							onclick={undoEditName}
							aria-label="Undo edit name"
						>
							<i class="bi bi-arrow-counterclockwise"></i>
						</button>
						<button
							class="btn btn-outline-secondary"
							type="button"
							onclick={saveName}
							disabled={!name || savingName}
						>
							{#if savingName}
								<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"
								></span>
							{/if}
							Save
						</button>
						<span class="invalid-feedback">{$validationErrors['name']}</span>
					</div>
				{:else}
					<span>
						{dataset.name}
						<button
							class="btn btn-primary float-end pt-0 pb-0"
							onclick={() => (editName = true)}
							aria-label="Edit dataset name"
						>
							<i class="bi bi-pencil"></i>
							Edit
						</button>
					</span>
				{/if}
			</li>
			<li class="list-group-item text-bg-light">
				<strong>Zarr dir</strong>
			</li>
			<li class="list-group-item">
				{#if editZarrDir}
					<div class="input-group has-validation">
						<input
							type="text"
							bind:value={zarrDir}
							class="form-control"
							class:is-invalid={$validationErrors['zarr_dir']}
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									saveZarrDir();
								}
							}}
						/>
						<button
							class="btn btn-outline-secondary"
							type="button"
							onclick={undoEditZarrDir}
							aria-label="Undo edit zarr dir"
						>
							<i class="bi bi-arrow-counterclockwise"></i>
						</button>
						<button
							class="btn btn-outline-secondary"
							type="button"
							onclick={saveZarrDir}
							disabled={!zarrDir || savingZarrDir}
						>
							{#if savingZarrDir}
								<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"
								></span>
							{/if}
							Save
						</button>
						<span class="invalid-feedback">{$validationErrors['zarr_dir']}</span>
					</div>
				{:else}
					<span>
						<button
							class="btn btn-primary float-end pt-0 pb-0"
							onclick={() => (editZarrDir = true)}
							aria-label="Edit Zarr dir"
						>
							<i class="bi bi-pencil"></i>
							Edit
						</button>
						<pre>{dataset.zarr_dir}</pre>
					</span>
				{/if}
			</li>
		</ul>
	{/snippet}
</Modal>
