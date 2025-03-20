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
	let historyRunId;
	/** @type {number} */
	let datasetId;
	/** @type {number} */
	let workflowTaskId;
	/** @type {number} */
	let historyRunIndex;

	/** @type {Modal} */
	let modal;

	/** @type {(import('fractal-components/types/api').Pagination<import('fractal-components/types/api').HistoryUnit>)|undefined} */
	let data = undefined;

	let loadingLogs = false;
	/** @type {number|undefined} */
	let selectedLogUnit = undefined;
	/** @type {Array<{text: string, highlight: boolean}>} */
	let logParts = [];
	let loadedLogsStatus = '';

	/**
	 * @param {number} _projectId
	 * @param {number} _historyRunId
	 * @param {number} _datasetId
	 * @param {number} _workflowTaskId
	 * @param {number} _historyRunIndex
	 */
	export async function open(
		_projectId,
		_historyRunId,
		_datasetId,
		_workflowTaskId,
		_historyRunIndex
	) {
		loading = true;
		projectId = _projectId;
		historyRunId = _historyRunId;
		datasetId = _datasetId;
		workflowTaskId = _workflowTaskId;
		historyRunIndex = _historyRunIndex;
		data = undefined;
		page = 1;
		pageSize = 10;
		modal.show();
		await loadRun(page, pageSize);
	}

	function onClose() {
		data = undefined;
	}

	/**
	 * @param {number} currentPage
	 * @param {number} selectedPageSize
	 */
	async function loadRun(currentPage, selectedPageSize) {
		loading = true;
		const url = `/api/v2/project/${projectId}/status/run/${historyRunId}/units?workflowtask_id=${workflowTaskId}&dataset_id=${datasetId}&page=${currentPage}&page_size=${selectedPageSize}`;
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
	 * @param {number} unitId
	 * @param {string} status
	 */
	async function loadLogs(unitId, status) {
		loadingLogs = true;
		const response = await fetch(
			`/api/v2/project/${projectId}/status/unit-log?history_run_id=${historyRunId}&history_unit_id=${unitId}&workflowtask_id=${workflowTaskId}&dataset_id=${datasetId}`,
			{
				method: 'GET'
			}
		);
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
		selectedLogUnit = unitId;
		loadingLogs = false;
	}
</script>

<Modal id="runStatusModal" bind:this={modal} fullscreen={true} bodyCss="p-0" {onClose}>
	<svelte:fragment slot="header">
		<h1 class="modal-title fs-5">
			{#if selectedLogUnit && !loadingLogs}
				Run {historyRunIndex} - Logs for unit #{selectedLogUnit}
			{:else}
				Run {historyRunIndex}
			{/if}
		</h1>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="errorAlert-runStatusModal" class="mb-2" />
		{#if loading && !data}
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
		{:else if selectedLogUnit && !loadingLogs}
			<div class="row">
				<div class="col">
					<ExpandableLog bind:logParts highlight={loadedLogsStatus === 'failed'} />
				</div>
			</div>
			<div class="row">
				<div class="col">
					<button class="m-2 ms-3 btn btn-primary" on:click={() => (selectedLogUnit = undefined)}>
						Back
					</button>
				</div>
			</div>
		{:else if data}
			{#if data.items.length > 0}
				<table class="table table-striped">
					<thead>
						<tr>
							<th>Unit id</th>
							<th>Status</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{#each data.items as run}
							<tr>
								<td>{run.id}</td>
								<td>{run.status || '-'}</td>
								<td>
									<button class="btn btn-light" on:click={() => loadLogs(run.id, run.status)}>
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
					onPageChange={(currentPage, pageSize) => loadRun(currentPage, pageSize)}
				/>
			{:else}
				<p class="ps-3">No images</p>
			{/if}
		{/if}
	</svelte:fragment>
</Modal>
