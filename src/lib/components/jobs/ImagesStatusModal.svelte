<script>
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import { extractJobErrorParts } from '$lib/common/job_utilities';
	import ExpandableLog from '../common/ExpandableLog.svelte';
	import Modal from '../common/Modal.svelte';
	import DatasetImagesTable from '../v2/projects/datasets/DatasetImagesTable.svelte';
	import { env } from '$env/dynamic/public';
	import { tick } from 'svelte';

	const vizarrViewerUrl = env.PUBLIC_FRACTAL_VIZARR_VIEWER_URL
		? env.PUBLIC_FRACTAL_VIZARR_VIEWER_URL.replace(/\/$|$/, '/')
		: null;

	/** @type {import('fractal-components/types/api').ImagePage|null} */
	let imagePage = null;
	let loading = false;

	/** @type {import('fractal-components/types/api').DatasetV2} */
	let dataset;
	/** @type {number} */
	let workflowTaskId;

	/** @type {Modal} */
	let modal;

	let loadingLogs = false;
	let selectedLogImage = '';
	/** @type {Array<{text: string, highlight: boolean}>} */
	let logParts = [];
	let loadedLogsStatus = '';
	let projectDir = '';

	/** @type {DatasetImagesTable} */
	let datasetImagesTable;

	/**
	 * @param {import('fractal-components/types/api').DatasetV2} _dataset
	 * @param {number} _workflowTaskId
	 */
	export async function open(_dataset, _workflowTaskId) {
		loading = true;
		imagePage = null;
		loadingLogs = false;
		logParts = [];
		selectedLogImage = '';
		dataset = _dataset;
		workflowTaskId = _workflowTaskId;
		modal.show();
		await loadProjectDir();
		await loadImages();
		await tick();
		await datasetImagesTable.load();
	}

	function onClose() {
		imagePage = null;
	}

	async function loadProjectDir() {
		const response = await fetch('/api/auth/current-user/settings');
		if (!response.ok) {
			return;
		}
		/** @type {import('fractal-components/types/api').UserSettings} */
		const result = await response.json();
		projectDir = result.project_dir || '';
	}

	async function loadImages() {
		loading = true;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const url = `/api/v2/project/${dataset.project_id}/status/images?workflowtask_id=${workflowTaskId}&dataset_id=${dataset.id}&page=1&page_size=10`;
		const response = await fetch(url, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				attributes_query: {}
			})
		});
		if (!response.ok) {
			loading = false;
			modal.displayErrorAlert(await getAlertErrorFromResponse(response));
			return;
		}
		imagePage = await response.json();
		loading = false;
	}

	/**
	 * @param {string} zarrUrl
	 * @param {string} status
	 */
	async function loadLogs(zarrUrl, status) {
		loadingLogs = true;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(`/api/v2/project/${dataset.project_id}/status/image-log`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				workflowtask_id: workflowTaskId,
				dataset_id: dataset.id,
				zarr_url: zarrUrl
			})
		});
		if (!response.ok) {
			modal.displayErrorAlert(await getAlertErrorFromResponse(response));
			loadingLogs = false;
			return;
		}
		const log = await response.json();
		loadedLogsStatus = status;
		if (status === 'failed') {
			logParts = extractJobErrorParts(log, false, true);
		} else {
			logParts = [{ text: log, highlight: false }];
		}
		selectedLogImage = zarrUrl;
		loadingLogs = false;
	}

	async function back() {
		selectedLogImage = '';
	}
</script>

<Modal id="imagesStatusModal" bind:this={modal} fullscreen={true} bodyCss="p-0" {onClose}>
	<svelte:fragment slot="header">
		<h1 class="modal-title fs-5">
			{#if selectedLogImage && !loadingLogs}
				Logs for {selectedLogImage}
			{:else}
				Images
			{/if}
		</h1>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="errorAlert-imagesStatusModal" class="mb-2" />
		{#if loading && !imagePage}
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
		{:else if selectedLogImage && !loadingLogs}
			<div class="row">
				<div class="col">
					<div class="ps-3 pe-3">
						<ExpandableLog bind:logParts highlight={loadedLogsStatus === 'failed'} />
					</div>
				</div>
			</div>
			<div class="row">
				<div class="col">
					<button class="m-2 ms-3 btn btn-primary" on:click={back}> Back </button>
				</div>
			</div>
		{/if}
		<div class:d-none={selectedLogImage || loadingLogs}>
			{#if imagePage}
				<DatasetImagesTable
					bind:this={datasetImagesTable}
					{dataset}
					bind:imagePage
					{vizarrViewerUrl}
					imagesStatusModal={true}
					imagesStatusModalUrl={`/api/v2/project/${dataset.project_id}/status/images?workflowtask_id=${workflowTaskId}&dataset_id=${dataset.id}`}
				>
					<svelte:fragment slot="extra-buttons" let:image>
						<button
							class="btn btn-light"
							on:click={() => loadLogs(image.zarr_url, image.status || '')}
							disabled={image.status === null}
						>
							{#if loadingLogs}
								<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
							{/if}
							<i class="bi-list-columns-reverse" /> Logs
						</button>
					</svelte:fragment>
				</DatasetImagesTable>
			{/if}
		</div>
	</svelte:fragment>
</Modal>
