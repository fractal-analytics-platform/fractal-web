<script>
	import { page } from '$app/stores';
	import { FormErrorHandler } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';

	/** @type {import('$lib/types-v2').DatasetV2} */
	export let dataset;
	/** @type {(dataset: import('$lib/types-v2').DatasetV2) => void} */
	export let updateDatasetCallback;

	/** @type {Modal} */
	let modal;

	let editName = false;
	let name = '';
	let editZarrDir = false;
	let zarrDir = '';

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

	let savingName = false;

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

	let savingZarrDir = false;

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
		const projectId = $page.params.projectId;
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

<Modal id="datasetInfoModal" centered={true} scrollable={true} {onOpen} bind:this={modal}>
	<svelte:fragment slot="header">
		<h5 class="modal-title">Dataset properties</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="errorAlert-datasetInfoModal" />
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
							on:keydown={(e) => {
								if (e.key === 'Enter') {
									saveName();
								}
							}}
						/>
						<button
							class="btn btn-outline-secondary"
							type="button"
							on:click={undoEditName}
							aria-label="Undo edit name"
						>
							<i class="bi bi-arrow-counterclockwise" />
						</button>
						<button
							class="btn btn-outline-secondary"
							type="button"
							on:click={saveName}
							disabled={!name || savingName}
						>
							{#if savingName}
								<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
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
							on:click={() => (editName = true)}
							aria-label="Edit dataset name"
						>
							<i class="bi bi-pencil" />
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
							on:keydown={(e) => {
								if (e.key === 'Enter') {
									saveZarrDir();
								}
							}}
						/>
						<button
							class="btn btn-outline-secondary"
							type="button"
							on:click={undoEditZarrDir}
							aria-label="Undo edit zarr dir"
						>
							<i class="bi bi-arrow-counterclockwise" />
						</button>
						<button
							class="btn btn-outline-secondary"
							type="button"
							on:click={saveZarrDir}
							disabled={!zarrDir || savingZarrDir}
						>
							{#if savingZarrDir}
								<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
							{/if}
							Save
						</button>
						<span class="invalid-feedback">{$validationErrors['zarr_dir']}</span>
					</div>
				{:else}
					<span>
						{dataset.zarr_dir}
						<button
							class="btn btn-primary float-end pt-0 pb-0"
							on:click={() => (editZarrDir = true)}
							aria-label="Edit Zarr dir"
						>
							<i class="bi bi-pencil" />
							Edit
						</button>
					</span>
				{/if}
			</li>
		</ul>
	</svelte:fragment>
</Modal>
