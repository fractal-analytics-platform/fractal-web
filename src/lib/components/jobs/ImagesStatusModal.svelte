<script>
	import { getAlertErrorFromResponse } from '$lib/common/errors';
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

	/** @type {(import('fractal-components/types/api').Pagination & {images: string[]})|undefined} */
	let data = undefined;

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
		projectId = _projectId;
		datasetId = _datasetId;
		workflowTaskId = _workflowTaskId;
		parametersHash = _parametersHash;
		status = _status;
		modal.show();
		await loadImages(page, pageSize);
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
</script>

<Modal id="imagesStatusModal" bind:this={modal} fullscreen={true}>
	<svelte:fragment slot="header">
		<h1 class="modal-title fs-5">Images with status='{status}'</h1>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="errorAlert-imagesStatusModal" class="mb-2" />
		{#if loading && !data}
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
		{:else if data}
			{#if data.images.length > 0}
				<table class="table table-striped">
					<tbody>
						{#each data.images as image}
							<tr><td>{image}</td></tr>
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
				<p>No images</p>
			{/if}
		{/if}
	</svelte:fragment>
</Modal>
