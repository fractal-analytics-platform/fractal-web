<script>
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import { extractJobErrorParts } from '$lib/common/job_utilities';
	import ExpandableLog from '../common/ExpandableLog.svelte';
	import Modal from '../common/Modal.svelte';
	import DatasetImagesTable from '../v2/projects/datasets/DatasetImagesTable.svelte';
	import { env } from '$env/dynamic/public';
	import { tick } from 'svelte';
	import { hideAllTooltips } from '$lib/common/component_utilities';
	import { getTypeFilterValues, STATUS_KEY } from '$lib/common/workflow_utilities';

	const vizarrViewerUrl = env.PUBLIC_FRACTAL_VIZARR_VIEWER_URL
		? env.PUBLIC_FRACTAL_VIZARR_VIEWER_URL.replace(/\/$|$/, '/')
		: null;

	/** @type {import('fractal-components/types/api').ImagePage|null} */
	let imagePage = $state(null);
	let loading = $state(false);

	/** @type {import('fractal-components/types/api').DatasetV2|undefined} */
	let dataset = $state();
	/** @type {import('fractal-components/types/api').WorkflowTaskV2|undefined} */
	let workflowTask = $state();
	/** @type {{ [key: string]: boolean }} */
	let frozenTypes = $state({});

	/** @type {Modal|undefined} */
	let modal = $state();

	let loadingLogs = $state(false);
	let selectedLogImage = $state('');
	/** @type {Array<{text: string, highlight: boolean}>} */
	let logParts = $state([]);
	let loadedLogsStatus = $state('');

	/** @type {DatasetImagesTable|undefined} */
	let datasetImagesTable = $state();

	/** @type {{ attribute_filters: { [key: string]: Array<string | number | boolean> | null }, type_filters: { [key: string]: boolean | null }} | null} */
	let initialFilterValues = $state(null);

	/**
	 * @param {import('fractal-components/types/api').DatasetV2} _dataset
	 * @param {import('fractal-components/types/api').WorkflowTaskV2} _workflowTask
	 */
	export async function open(_dataset, _workflowTask) {
		loading = true;
		imagePage = null;
		loadingLogs = false;
		logParts = [];
		selectedLogImage = '';
		dataset = _dataset;
		workflowTask = _workflowTask;
		frozenTypes = {
			...workflowTask.type_filters,
			...workflowTask.task.input_types
		};
		const initialTypeFilters = await getTypeFilterValues(_dataset.project_id, workflowTask);
		initialFilterValues = {
			attribute_filters: {},
			type_filters: initialTypeFilters
		};
		modal?.show();
		await loadImages();
		await tick();
		await datasetImagesTable?.load(false);
	}

	function onClose() {
		imagePage = null;
	}

	async function loadImages() {
		loading = true;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const url = `/api/v2/project/${dataset?.project_id}/status/images?workflowtask_id=${workflowTask?.id}&dataset_id=${dataset?.id}&page=1&page_size=10`;
		const response = await fetch(url, {
			method: 'POST',
			headers,
			body: JSON.stringify(initialFilterValues)
		});
		if (!response.ok) {
			loading = false;
			modal?.displayErrorAlert(await getAlertErrorFromResponse(response));
			return;
		}
		imagePage = await response.json();
		loading = false;
	}

	/**
	 * @param {import('fractal-components/types/api').Image} image
	 */
	async function loadLogs(image) {
		hideAllTooltips();
		loadingLogs = true;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(`/api/v2/project/${dataset?.project_id}/status/image-log`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				workflowtask_id: workflowTask?.id,
				dataset_id: dataset?.id,
				zarr_url: image.zarr_url
			})
		});
		if (!response.ok) {
			modal?.displayErrorAlert(await getAlertErrorFromResponse(response));
			loadingLogs = false;
			return;
		}
		const log = await response.json();
		loadedLogsStatus = getImageStatus(image);
		if (loadedLogsStatus === 'failed') {
			logParts = extractJobErrorParts(log, false, true);
		} else {
			logParts = [{ text: log, highlight: false }];
		}
		selectedLogImage = image.zarr_url;
		loadingLogs = false;
	}

	async function back() {
		selectedLogImage = '';
	}

	/**
	 * @param {import('fractal-components/types/api').Image} image
	 * @returns {string}
	 */
	function getImageStatus(image) {
		return /** @type {string} */ (image.attributes[STATUS_KEY]);
	}
</script>

<Modal id="imagesStatusModal" bind:this={modal} fullscreen={true} bodyCss="p-0" {onClose}>
	{#snippet header()}
		<h1 class="modal-title fs-5">
			{#if selectedLogImage && !loadingLogs}
				Logs for {selectedLogImage}
			{:else}
				Images
			{/if}
		</h1>
	{/snippet}
	{#snippet body()}
		<div id="errorAlert-imagesStatusModal" class="mb-2"></div>
		{#if loading && !imagePage}
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
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
					<button class="m-2 ms-3 btn btn-primary" onclick={back}> Back </button>
				</div>
			</div>
		{/if}
		<div class:d-none={selectedLogImage || loadingLogs}>
			{#if imagePage && dataset}
				<DatasetImagesTable
					bind:this={datasetImagesTable}
					{dataset}
					bind:imagePage
					{vizarrViewerUrl}
					disabledTypes={Object.keys(frozenTypes)}
					{initialFilterValues}
					imagesStatusModal={true}
					queryUrl={`/api/v2/project/${dataset?.project_id}/status/images?workflowtask_id=${workflowTask?.id}&dataset_id=${dataset.id}`}
				>
					{#snippet extraButtons(image)}
						<button
							class="btn btn-light"
							onclick={() => loadLogs(image)}
							disabled={getImageStatus(image) === null}
						>
							{#if loadingLogs}
								<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"
								></span>
							{/if}
							<i class="bi-list-columns-reverse"></i> Logs
						</button>
					{/snippet}
				</DatasetImagesTable>
			{/if}
		</div>
	{/snippet}
</Modal>
