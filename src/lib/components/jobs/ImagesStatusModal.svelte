<script>
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import { extractJobErrorParts } from '$lib/common/job_utilities';
	import ExpandableLog from '../common/ExpandableLog.svelte';
	import Modal from '../common/Modal.svelte';
	import Paginator from '../common/Paginator.svelte';

	let loading = false;
	let page = 1;
	let pageSize = 10;
	let totalCount = 0;

	/** @type {number} */
	let projectId;
	/** @type {number} */
	let datasetId;
	/** @type {number} */
	let workflowTaskId;
	/** @type {string|undefined} */
	let parametersHash = undefined;
	/** @type {string} */
	let status;

	/** @type {Modal} */
	let modal;

	/** @type {(import('fractal-components/types/api').Pagination<string>)|undefined} */
	let data = undefined;

	let loadingLogs = false;
	let selectedLogImage = '';
	/** @type {Array<{text: string, highlight: boolean}>} */
	let logParts = [];

	/**
	 * @param {number} _projectId
	 * @param {number} _datasetId
	 * @param {number} _workflowTaskId
	 * @param {string|undefined} _parametersHash
	 * @param {string} _status
	 */
	export async function open(_projectId, _datasetId, _workflowTaskId, _parametersHash, _status) {
		loading = true;
		data = undefined;
		page = 1;
		pageSize = 10;
		loadingLogs = false;
		logParts = [];
		selectedLogImage = '';
		projectId = _projectId;
		datasetId = _datasetId;
		workflowTaskId = _workflowTaskId;
		parametersHash = _parametersHash;
		status = _status;
		modal.show();
		await loadImages(page, pageSize);
	}

	function onClose() {
		data = undefined;
	}

	/**
	 * @param {number} currentPage
	 * @param {number} selectedPageSize
	 */
	async function loadImages(currentPage, selectedPageSize) {
		loading = true;
		let url = `/api/v2/project/${projectId}/status/images?workflowtask_id=${workflowTaskId}&dataset_id=${datasetId}&status=${status}&page=${currentPage}&page_size=${selectedPageSize}`;
		if (parametersHash !== undefined) {
			url += `&parameters_hash=${parametersHash}`;
		}
		const response = await fetch(url);
		if (!response.ok) {
			loading = false;
			modal.displayErrorAlert(await getAlertErrorFromResponse(response));
			return;
		}
		data = await response.json();
		if (data) {
			page = data.current_page;
			pageSize = data.page_size;
			totalCount = data.total_count;
		}
		loading = false;
	}

	/**
	 * @param {string} zarrUrl
	 */
	async function loadLogs(zarrUrl) {
		loadingLogs = true;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(
			`/api/v2/project/${projectId}/status/image-logs?workflowtask_id=${workflowTaskId}&dataset_id=${datasetId}&zarr_url=${zarrUrl}`,
			{
				method: 'POST',
				headers,
				body: JSON.stringify({
					workflowtask_id: workflowTaskId,
					dataset_id: datasetId,
					zarr_url: zarrUrl
				})
			}
		);
		if (!response.ok) {
			modal.displayErrorAlert(await getAlertErrorFromResponse(response));
			loadingLogs = false;
			return;
		}
		const log = await response.json();
		if (status === 'failed') {
			logParts = extractJobErrorParts(log, false, true);
		} else {
			logParts = [{ text: log, highlight: false }];
		}
		selectedLogImage = zarrUrl;
		loadingLogs = false;
	}
</script>

<Modal id="imagesStatusModal" bind:this={modal} fullscreen={true} bodyCss="p-0" {onClose}>
	<svelte:fragment slot="header">
		<h1 class="modal-title fs-5">
			{#if selectedLogImage && !loadingLogs}
				Logs for {selectedLogImage}
			{:else}
				Images with status='{status}'
			{/if}
		</h1>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="errorAlert-imagesStatusModal" class="mb-2" />
		{#if loading && !data}
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
		{:else if selectedLogImage && !loadingLogs}
			<div class="row">
				<div class="col">
					<ExpandableLog bind:logParts highlight={status === 'failed'} />
				</div>
			</div>
			<div class="row">
				<div class="col">
					<button class="m-2 ms-3 btn btn-primary" on:click={() => (selectedLogImage = '')}>
						Back
					</button>
				</div>
			</div>
		{:else if data}
			{#if data.items.length > 0}
				<table class="table table-striped">
					<tbody>
						{#each data.items as image}
							<tr>
								<td>{image}</td>
								<td>
									<button class="btn btn-light" on:click={() => loadLogs(image)}>
										{#if loadingLogs}
											<span
												class="spinner-border spinner-border-sm"
												role="status"
												aria-hidden="true"
											/>
										{/if}
										<i class="bi-list-columns-reverse" /> Logs
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
				<Paginator
					currentPage={page}
					{pageSize}
					{totalCount}
					onPageChange={(currentPage, pageSize) => loadImages(currentPage, pageSize)}
				/>
			{:else}
				<p class="ps-3">No images</p>
			{/if}
		{/if}
	</svelte:fragment>
</Modal>
