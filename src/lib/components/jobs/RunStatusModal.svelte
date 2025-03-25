<script>
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import { extractJobErrorParts } from '$lib/common/job_utilities';
	import SlimSelect from 'slim-select';
	import ExpandableLog from '../common/ExpandableLog.svelte';
	import Modal from '../common/Modal.svelte';
	import Paginator from '../common/Paginator.svelte';
	import { tick } from 'svelte';

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

	let statusFilter = '';
	/** @type {SlimSelect|undefined} */
	let statusFilterSelector = undefined;

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
		await tick();
		setStatusFilterSelector();
	}

	function onClose() {
		data = undefined;
		statusFilter = '';
		unsetStatusFilterSelector();
	}

	/**
	 * @param {number} currentPage
	 * @param {number} selectedPageSize
	 */
	async function loadRun(currentPage, selectedPageSize) {
		loading = true;
		let url = `/api/v2/project/${projectId}/status/run/${historyRunId}/units?workflowtask_id=${workflowTaskId}&dataset_id=${datasetId}&page=${currentPage}&page_size=${selectedPageSize}`;
		if (statusFilter) {
			url += `&unit_status=${statusFilter}`;
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
	 * @param {number} unitId
	 * @param {string} status
	 */
	async function loadLogs(unitId, status) {
		unsetStatusFilterSelector();
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

	async function back() {
		selectedLogUnit = undefined;
		await tick();
		setStatusFilterSelector();
	}

	function setStatusFilterSelector() {
		const elementId = 'status-filter';
		const placeholder = 'Select...';
		const selectElement = document.getElementById(elementId);
		selectElement?.classList.remove('invisible');
		statusFilterSelector = new SlimSelect({
			select: `#${elementId}`,
			settings: {
				maxValuesShown: 5,
				showSearch: true,
				allowDeselect: true,
				ariaLabel: 'Select status'
			},
			events: {
				afterChange: (selection) => {
					if (selection.length === 0 || selection[0].value === placeholder) {
						statusFilter = '';
					} else {
						statusFilter = selection[0].value;
					}
					statusFilterChanged();
				}
			}
		});

		const options = ['done', 'failed', 'submitted'];
		statusFilterSelector.setData([
			{ text: placeholder, placeholder: true },
			...options.map((o) => ({ text: o, value: o }))
		]);

		if (statusFilter) {
			statusFilterSelector.setSelected(statusFilter);
		}
	}

	function unsetStatusFilterSelector() {
		statusFilterSelector?.destroy();
		const selectElement = document.getElementById('status-filter');
		selectElement?.classList.add('invisible');
	}

	async function statusFilterChanged() {
		page = 1;
		await loadRun(page, pageSize);
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
					<button class="m-2 ms-3 btn btn-primary" on:click={back}> Back </button>
				</div>
			</div>
		{:else if data}
			<table class="table table-striped">
				<colgroup>
					<col width="30%" />
					<col width="30%" />
					<col width="40%" />
				</colgroup>
				<thead>
					<tr>
						<th>Unit id</th>
						<th>Status</th>
						<th />
					</tr>
					<tr>
						<th />
						<th>
							<select id="status-filter" class="invisible" />
						</th>
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
		{/if}
	</svelte:fragment>
</Modal>
