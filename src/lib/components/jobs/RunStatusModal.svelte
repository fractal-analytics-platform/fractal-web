<script>
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import { extractJobErrorParts } from '$lib/common/job_utilities';
	import SlimSelect from 'slim-select';
	import ExpandableLog from '../common/ExpandableLog.svelte';
	import Modal from '../common/Modal.svelte';
	import Paginator from '../common/Paginator.svelte';
	import { tick } from 'svelte';
	import { getRelativeZarrPath } from '$lib/common/workflow_utilities';

	let loading = $state(false);
	let page = $state(1);
	let pageSize = $state(10);
	let totalCount = $state(0);

	/** @type {number} */
	let historyRunId;
	/** @type {import('fractal-components/types/api').DatasetV2|undefined} */
	let dataset = $state();
	/** @type {import('fractal-components/types/api').WorkflowTaskV2|undefined} */
	let workflowTask;
	/** @type {number|undefined} */
	let historyRunIndex = $state();

	/** @type {Modal|undefined} */
	let modal = $state();

	/** @type {(import('fractal-components/types/api').Pagination<import('fractal-components/types/api').HistoryUnit>)|undefined} */
	let data = $state();

	/** @type {import('fractal-components/types/api').HistoryUnit|undefined} */
	let selectedUnit = $state(undefined);

	let loadingLogs = $state(false);
	/** @type {Array<{text: string, highlight: boolean}>} */
	let logParts = $state([]);
	let loadedLogsStatus = $state('');

	let showLogs = $state(false);
	let showZarrUrls = $state(false);

	let statusFilter = '';
	/** @type {SlimSelect|undefined} */
	let statusFilterSelector = undefined;

	/**
	 * @param {number} _historyRunId
	 * @param {import('fractal-components/types/api').DatasetV2} _dataset
	 * @param {import('fractal-components/types/api').WorkflowTaskV2} _workflowTask
	 * @param {number} _historyRunIndex
	 */
	export async function open(_historyRunId, _dataset, _workflowTask, _historyRunIndex) {
		loading = true;
		historyRunId = _historyRunId;
		dataset = _dataset;
		workflowTask = _workflowTask;
		historyRunIndex = _historyRunIndex;
		selectedUnit = undefined;
		showLogs = false;
		showZarrUrls = false;
		data = undefined;
		page = 1;
		pageSize = 10;
		modal?.show();
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
		let url = `/api/v2/project/${dataset?.project_id}/status/run/${historyRunId}/units?workflowtask_id=${workflowTask?.id}&dataset_id=${dataset?.id}&page=${currentPage}&page_size=${selectedPageSize}`;
		if (statusFilter) {
			url += `&unit_status=${statusFilter}`;
		}
		const response = await fetch(url);
		if (!response.ok) {
			loading = false;
			modal?.displayErrorAlert(await getAlertErrorFromResponse(response));
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
	 * @param {import('fractal-components/types/api').HistoryUnit} unit
	 */
	async function loadLogs(unit) {
		unsetStatusFilterSelector();
		loadingLogs = true;
		const response = await fetch(
			`/api/v2/project/${dataset?.project_id}/status/unit-log?history_run_id=${historyRunId}&history_unit_id=${unit.id}&workflowtask_id=${workflowTask?.id}&dataset_id=${dataset?.id}`,
			{
				method: 'GET'
			}
		);
		if (!response.ok) {
			modal?.displayErrorAlert(await getAlertErrorFromResponse(response));
			loadingLogs = false;
			return;
		}
		const log = await response.json();
		loadedLogsStatus = unit.status;
		if (unit.status === 'failed') {
			logParts = extractJobErrorParts(log, false, true);
		} else {
			logParts = [{ text: log, highlight: false }];
		}
		selectedUnit = unit;
		loadingLogs = false;
		showLogs = true;
	}

	/**
	 * @param {import('fractal-components/types/api').HistoryUnit} unit
	 */
	async function displayZarrUrls(unit) {
		unsetStatusFilterSelector();
		showZarrUrls = true;
		selectedUnit = unit;
		await tick();
		modal?.restoreModalFocus();
	}

	async function back() {
		showZarrUrls = false;
		showLogs = false;
		selectedUnit = undefined;
		await tick();
		setStatusFilterSelector();
		modal?.restoreModalFocus();
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

	let hasZarrUrlsInTable = $derived(
		data !== undefined && data.items.find((u) => u.zarr_urls.length === 1) !== undefined
	);
</script>

<Modal id="runStatusModal" bind:this={modal} fullscreen={true} bodyCss="p-0" {onClose}>
	{#snippet header()}
		<h1 class="modal-title fs-5">
			{#if showLogs && !loadingLogs}
				Run {historyRunIndex} - Logs for unit #{selectedUnit?.id}
			{:else if showZarrUrls}
				Run {historyRunIndex} - Zarr URLs for unit #{selectedUnit?.id}
			{:else}
				Run {historyRunIndex}
			{/if}
		</h1>
	{/snippet}
	{#snippet body()}
		<div id="errorAlert-runStatusModal" class="mb-2"></div>
		{#if loading && !data}
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
		{:else if showLogs && !loadingLogs}
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
		{:else if showZarrUrls && selectedUnit}
			<div class="row">
				<div class="col">
					{#if selectedUnit.zarr_urls.length === 0}
						<p class="ms-3 mb-0 mt-2">No Zarr URLs</p>
					{:else}
						<table class="table table-striped">
							<tbody>
								{#each selectedUnit.zarr_urls as zarrUrl (zarrUrl)}
									<tr>
										<td>{zarrUrl}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					{/if}
				</div>
			</div>
			<div class="row">
				<div class="col">
					<button class="m-2 ms-3 btn btn-primary" onclick={back}> Back </button>
				</div>
			</div>
		{:else if data}
			<table class="table table-striped">
				<colgroup>
					{#if hasZarrUrlsInTable}
						<col width="10%" />
						<col width="20%" />
						<col width="60%" />
						<col width="10%" />
					{:else}
						<col width="20%" />
						<col width="30%" />
						<col width="30%" />
						<col width="20%" />
					{/if}
				</colgroup>
				<thead>
					<tr>
						<th>Unit id</th>
						<th>Status</th>
						<th>Zarr URLs</th>
						<th></th>
					</tr>
					<tr>
						<th></th>
						<th>
							<select id="status-filter" class="invisible"></select>
						</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.items as unit (unit.id)}
						<tr>
							<td>{unit.id}</td>
							<td>{unit.status || '-'}</td>
							<td>
								{#if unit.zarr_urls.length === 0}
									-
								{:else if unit.zarr_urls.length === 1 && dataset}
									{getRelativeZarrPath(dataset, unit.zarr_urls[0])}
								{:else}
									<button class="btn btn-light" onclick={() => displayZarrUrls(unit)}>
										<i class="bi bi-list-task"></i> Zarr URLs
									</button>
								{/if}
							</td>
							<td>
								<button
									class="btn btn-light me-2"
									onclick={() => loadLogs(unit)}
									disabled={loadingLogs}
								>
									{#if loadingLogs}
										<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"
										></span>
									{/if}
									<i class="bi-list-columns-reverse"></i> Logs
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
	{/snippet}
</Modal>
