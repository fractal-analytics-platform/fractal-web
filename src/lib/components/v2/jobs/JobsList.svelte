<script>
	import { env } from '$env/dynamic/public';
	import { page } from '$app/state';
	import StatusBadge from '$lib/components/jobs/StatusBadge.svelte';
	import JobInfoModal from '$lib/components/v2/jobs/JobInfoModal.svelte';
	import JobLogsModal from '$lib/components/v2/jobs/JobLogsModal.svelte';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import { onDestroy, onMount } from 'svelte';
	import { removeDuplicatedItems } from '$lib/common/component_utilities';
	import StandardDismissableAlert from '../../common/StandardDismissableAlert.svelte';
	import TimestampCell from '../../jobs/TimestampCell.svelte';
	import SlimSelect from 'slim-select';

	/**
	 * @typedef {Object} Props
	 * @property {() => Promise<import('fractal-components/types/api').ApplyWorkflowV2[]>} jobUpdater
	 * @property {Array<string>} [columnsToHide]
	 * @property {boolean} [admin]
	 * @property {import('svelte').Snippet} [buttons]
	 * @property {import('svelte').Snippet<[import('fractal-components/types/api').ApplyWorkflowV2]>} [editStatus]
	 */

	/** @type {Props} */
	let {
		jobUpdater,
		columnsToHide = [],
		admin = false,
		buttons = undefined,
		editStatus = undefined
	} = $props();

	/** @type {JobInfoModal} */
	let jobInfoModal;
	/** @type {JobLogsModal} */
	let jobLogsModal;

	/** @type {Array<import('fractal-components/types/api').ProjectV2>} */
	let projects = page.data.projects;
	/** @type {{id: number, name: string}[]} */
	let workflows = $state([]);
	/** @type {Array<import('fractal-components/types/api').ApplyWorkflowV2>} */
	let jobs = [];
	/** @type {{ id: number, name: string }[]} */
	let datasets = $state([]);

	/** @type {Array<import('fractal-components/types/api').ApplyWorkflowV2>} */
	let rows = $state(jobs);

	// Selectors
	/** @type {SlimSelect|undefined} */
	let statusSelect;
	/** @type {SlimSelect|undefined} */
	let projectSelect;
	/** @type {SlimSelect|undefined} */
	let workflowSelect;
	/** @type {SlimSelect|undefined} */
	let datasetSelect;
	/** @type {SlimSelect|undefined} */
	let outputDatasetSelect;

	// Filters
	let statusFilter = '';
	let projectFilter = '';
	let workflowFilter = '';
	let datasetFilter = '';

	/**
	 * @typedef {{ key: string, label: string, direction?: 'asc'|'desc', priority?: number, field?: (j: import('fractal-components/types/api').ApplyWorkflowV2) => number | string | null}} SortField
	 */

	/**
	 * @type {Array<SortField>}
	 */
	let columns = $state([
		{ key: 'id', label: 'Id', direction: 'desc', priority: 1, field: (j) => j.id },
		{ key: 'status', label: 'Status', field: (j) => j.status },
		{ key: 'options', label: 'Options' },
		{ key: 'start_timestamp', label: 'Start', field: (j) => j.start_timestamp },
		{ key: 'end_timestamp', label: 'End', field: (j) => j.end_timestamp },
		{ key: 'project', label: 'Project', field: (j) => j.project_dump.id },
		{ key: 'workflow', label: 'Workflow', field: (j) => j.workflow_dump.id },
		{ key: 'dataset', label: 'Dataset', field: (j) => j.dataset_dump.id },
		{ key: 'user_email', label: 'User', field: (j) => j.user_email }
	]);

	/**
	 * @param {SortField} sortField
	 */
	function updateSortField(sortField) {
		const priorities = columns.map((c) => c.priority).filter((p) => p !== undefined);
		const maxPriority = priorities.length > 0 ? Math.max(...priorities) : 0;
		const direction = sortField.direction === 'asc' ? 'desc' : 'asc';
		/** @type {SortField} */
		const updatedSortField = { ...sortField, direction, priority: maxPriority + 1 };
		columns = columns.map((s) => (s.key === sortField.key ? updatedSortField : s));
		updateRows();
	}

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	/**
	 * @param {import('fractal-components/types/api').ApplyWorkflowV2[]} newJobs
	 */
	export function setJobs(newJobs) {
		jobs = newJobs;
		workflows = removeDuplicatedItems(
			/** @type {{id: number, name: string}[]} */ (
				jobs.filter((j) => j.workflow_dump).map((j) => j.workflow_dump)
			)
		);
		datasets = removeDuplicatedItems(
			/** @type {{id: number, name: string}[]} */
			(jobs.filter((j) => j.dataset_dump).map((j) => j.dataset_dump))
		);
		updateRows();
	}

	function updateRows() {
		if (admin) {
			rows = getSortedJobs(jobs);
			return;
		}

		rows = getSortedJobs(
			jobs
				.filter((j) => (statusFilter ? j.status === statusFilter : j))
				.filter((j) => (projectFilter ? j.project_dump.id.toString() === projectFilter : j))
				.filter((j) => (workflowFilter ? j.workflow_dump.id.toString() === workflowFilter : j))
				.filter((j) => (datasetFilter ? j.dataset_dump.id.toString() === datasetFilter : j))
		);

		rebuildSlimSelectOptions(rows);
	}

	/**
	 * @param {Array<import('fractal-components/types/api').ApplyWorkflowV2>} jobs
	 */
	function getSortedJobs(jobs) {
		const sortedRows = [...jobs];
		const sortColumns = columns.filter(
			(c) => c.direction !== undefined && c.priority !== undefined && c.field
		);
		sortColumns.sort((c1, c2) => (Number(c1.priority) > Number(c2.priority) ? 1 : -1));
		for (const sortField of sortColumns) {
			sortedRows.sort((a, b) => {
				const field = sortField.field;
				if (!field) {
					return -1;
				}
				const [field1, field2] = [field(a), field(b)];
				const result = field1 === null ? -1 : field2 === null ? 1 : field1 < field2 ? -1 : 1;
				return sortField.direction === 'desc' ? -1 * result : result;
			});
		}
		return sortedRows;
	}

	let cancellingJobs = $state([]);
	let jobCancelledMessage = $state('');

	/**
	 * Requests the server to stop a job execution
	 * @param {import('fractal-components/types/api').ApplyWorkflowV2} job
	 * @returns {Promise<void>}
	 */
	async function handleJobCancel(job) {
		if (errorAlert) {
			errorAlert.hide();
		}

		console.log('Stop submitted job');

		cancellingJobs = [...cancellingJobs, job.id];
		jobCancelledMessage = '';

		let stopJobUrl = admin
			? `/api/admin/v2/job/${job.id}/stop`
			: `/api/v2/project/${job.project_id}/job/${job.id}/stop`;
		const response = await fetch(stopJobUrl, {
			method: 'GET',
			credentials: 'include'
		});

		cancellingJobs = cancellingJobs.filter((j) => j !== job.id);

		if (response.ok) {
			jobCancelledMessage = 'Job cancellation request received. The job will stop in a few seconds';
		} else {
			console.error('Error stopping job');
			errorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'jobUpdatesError'
			);
		}
	}

	const updateJobsInterval = env.PUBLIC_UPDATE_JOBS_INTERVAL
		? parseInt(env.PUBLIC_UPDATE_JOBS_INTERVAL)
		: 3000;
	let updateJobsTimeout = undefined;

	async function updateJobsInBackground() {
		const jobsToCheck = jobs.filter((j) => j.status === 'submitted');
		if (jobsToCheck.length > 0) {
			setJobs(await jobUpdater());
		}
		clearTimeout(updateJobsTimeout);
		updateJobsTimeout = setTimeout(updateJobsInBackground, updateJobsInterval);
	}

	/**
	 * @param {import('fractal-components/types/api').ApplyWorkflowV2} row
	 */
	function getDownloadUrl(row) {
		if (admin) {
			return `/api/admin/v2/job/${row.id}/download`;
		} else {
			return `/api/v2/project/${row.project_id}/job/${row.id}/download`;
		}
	}

	function clearFilters() {
		columns = columns.map((c) =>
			c.key === 'id'
				? { ...c, direction: 'desc', priority: 1 }
				: { ...c, direction: undefined, priority: undefined }
		);
		updateRows();
		statusSelect?.setSelected('');
		projectSelect?.setSelected('');
		workflowSelect?.setSelected('');
		datasetSelect?.setSelected('');
		outputDatasetSelect?.setSelected('');
	}

	onMount(() => {
		workflows = page.data.workflows;
		datasets = page.data.datasets;
		setJobs(page.data.jobs || []);

		updateJobsTimeout = setTimeout(updateJobsInBackground, updateJobsInterval);

		if (admin) {
			return;
		}

		statusSelect = setSlimSelect(
			'status-select',
			[
				{ id: 'submitted', name: 'Submitted' },
				{ id: 'done', name: 'Done' },
				{ id: 'failed', name: 'Failed' }
			],
			(value) => {
				if (statusFilter !== value) {
					statusFilter = value;
					updateRows();
				}
			},
			false
		);
		projectSelect = setSlimSelect('project-select', projects, (value) => {
			if (projectFilter !== value) {
				projectFilter = value;
				updateRows();
			}
		});
		workflowSelect = setSlimSelect('workflow-select', workflows, (value) => {
			if (workflowFilter !== value) {
				workflowFilter = value;
				updateRows();
			}
		});
		datasetSelect = setSlimSelect('dataset-select', datasets, (value) => {
			if (datasetFilter !== value) {
				datasetFilter = value;
				updateRows();
			}
		});
	});

	/**
	 * Initializes slim-select dropdown on a given HTML element.
	 * @param {string} id id of HTML element where slim-select has to be configured
	 * @param {Array<{ name: string, id: number|string }>} values
	 * @param {(value: string) => void} setter function executed when a dropdown value is selected
	 * @param {boolean} showSearch
	 * @returns the SlimSelect instance
	 */
	function setSlimSelect(id, values, setter, showSearch = true) {
		if (!values) {
			return;
		}
		const selectElement = document.getElementById(id);
		if (!selectElement) {
			return;
		}
		selectElement.classList.remove('invisible');
		const select = new SlimSelect({
			select: `#${id}`,
			settings: {
				maxValuesShown: 5,
				showSearch,
				allowDeselect: true
			},
			events: {
				afterChange: (selection) => {
					const selectedOption = selection[0];
					if (!selectedOption || selectedOption.placeholder) {
						setter('');
					} else {
						setter(selectedOption.value);
					}
				}
			}
		});
		setSlimSelectOptions(select, values);
		return select;
	}

	/**
	 * Rebuilds valid slim-select options according to the visible rows.
	 * Example: if a project filter is selected the user can select only the workflows belonging to that project.
	 * @param {import('fractal-components/types/api').ApplyWorkflowV2[]} rows
	 */
	function rebuildSlimSelectOptions(rows) {
		setValidSlimSelectOptions(
			workflowSelect,
			workflows.filter((w) => rows.filter((r) => r.workflow_dump.id === w.id).length > 0)
		);
		setValidSlimSelectOptions(
			datasetSelect,
			datasets.filter((d) => rows.filter((r) => r.dataset_dump.id === d.id).length > 0)
		);
	}

	/**
	 * Updates the available options only when needed, to avoid unsetting the selected value when the desired list of
	 * options is already set (e.g. if we change the selected dataset we don't want to change the selected workflow).
	 * @param {SlimSelect|undefined} select
	 * @param {{id: number, name: string}[]} validValues
	 */
	function setValidSlimSelectOptions(select, validValues) {
		if (!select) {
			return;
		}
		const selected = select.getSelected()[0];
		if (!selected || !validValues.map((v) => v.id.toString()).includes(selected)) {
			setSlimSelectOptions(select, validValues);
		}
	}

	/**
	 * Updates SlimSelect options. This rebuilds the HTML elements and unset the selected value.
	 * @param {SlimSelect|undefined} select
	 * @param {Array<{ name: string, id: number|string }>} values
	 */
	function setSlimSelectOptions(select, values) {
		if (!select) {
			return;
		}
		const options = values.map((p) => ({ text: p.name, value: p.id.toString() }));
		select.setData([{ text: 'All', placeholder: true }, ...options]);
	}

	onDestroy(() => {
		clearTimeout(updateJobsTimeout);
	});
</script>

<StandardDismissableAlert message={jobCancelledMessage} />

<div class="d-flex justify-content-end align-items-center mb-3">
	<div>
		{#if !admin}
			<button class="btn btn-warning" onclick={clearFilters}>
				<i class="bi-x-square"></i>
				Clear filters
			</button>
		{/if}
		{@render buttons?.()}
	</div>
</div>
<div id="jobUpdatesError"></div>
<table class="table jobs-table">
	<colgroup>
		{#if !columnsToHide.includes('id')}
			<col width="60" />
		{/if}
		<col width="100" />
		<col width="110" />
		<col width="100" />
		<col width="100" />
		{#if !columnsToHide.includes('project')}
			<col width="110" />
		{/if}
		{#if !columnsToHide.includes('workflow')}
			<col width="110" />
		{/if}
		<col width="110" />
		{#if !columnsToHide.includes('user_email')}
			<col width="120" />
		{/if}
	</colgroup>
	<thead class="table-light">
		<tr>
			{#key columns}
				{#each columns as column (column.key)}
					{#if !columnsToHide.includes(column.key)}
						{#if column.field}
							<th onclick={() => updateSortField(column)} style="cursor: pointer">
								{column.label}
								{#if column.direction === 'asc'}
									↑
								{:else if column.direction === 'desc'}
									↓
								{:else}
									⇅
								{/if}
							</th>
						{:else}
							<th>{column.label}</th>
						{/if}
					{/if}
				{/each}
			{/key}
		</tr>
		{#if !admin}
			<tr>
				{#if !columnsToHide.includes('id')}
					<th></th>
				{/if}
				<th>
					<select id="status-select" class="invisible"></select>
				</th>
				<th></th>
				<th></th>
				<th></th>
				{#if !columnsToHide.includes('project')}
					<th>
						{#if projects}
							<select id="project-select" class="invisible"></select>
						{/if}
					</th>
				{/if}
				{#if !columnsToHide.includes('workflow')}
					<th>
						{#if workflows}
							<select id="workflow-select" class="invisible"></select>
						{/if}
					</th>
				{/if}
				<th>
					<select id="dataset-select" class="invisible"></select>
				</th>
				{#if !columnsToHide.includes('user_email')}
					<th></th>
				{/if}
			</tr>
		{/if}
	</thead>

	<tbody>
		{#each rows as row (row.id)}
			<tr class="align-middle">
				{#if !columnsToHide.includes('id')}
					<td> {row.id} </td>
				{/if}
				<td>
					<span>
						<StatusBadge status={row.status} />
						{#if admin}
							{@render editStatus?.(row)}
						{/if}
					</span>
				</td>
				<td>
					<button
						class="btn btn-info"
						onclick={(event) => {
							event.preventDefault();
							jobInfoModal.show(row);
						}}
					>
						<i class="bi-info-circle"></i>
						Info
					</button>
					<button
						class="btn btn-light"
						onclick={(event) => {
							event.preventDefault();
							jobLogsModal.show(row, admin);
						}}
					>
						<i class="bi-list-columns-reverse"></i>
						Logs
					</button>
					{#if (admin && row.id) || (row.project_id !== null && row.user_email === page.data.userInfo.email)}
						<a
							class="btn btn-light"
							href={getDownloadUrl(row)}
							download={`${row.id}_logs.zip`}
							aria-label="Download logs"
						>
							<i class="bi-arrow-down-circle"></i>
						</a>
					{/if}
					{#if row.status === 'submitted'}
						<button
							class="btn btn-danger"
							onclick={() => handleJobCancel(row)}
							disabled={cancellingJobs.includes(row.id)}
						>
							{#if cancellingJobs.includes(row.id)}
								<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true">
								</span>
							{:else}
								<i class="bi-x-circle"></i>
							{/if}
							Cancel
						</button>
					{/if}
				</td>
				<td>
					<TimestampCell timestamp={row.start_timestamp} />
				</td>
				<td>
					<TimestampCell timestamp={row.end_timestamp} />
				</td>
				{#if !columnsToHide.includes('project')}
					<td>
						{#if projects && row.project_id !== null && row.user_email === page.data.userInfo.email}
							<a href={`/v2/projects/${row.project_id}`}>
								{row.project_dump.name}
							</a>
						{:else}
							{row.project_dump.name || '-'}
						{/if}
					</td>
				{/if}
				{#if !columnsToHide.includes('workflow')}
					<td>
						{#if workflows && row.workflow_id !== null && row.user_email === page.data.userInfo.email}
							<a href={`/v2/projects/${row.project_id}/workflows/${row.workflow_id}`}>
								{row.workflow_dump.name}
							</a>
						{:else}
							{row.workflow_dump.name}
						{/if}
					</td>
				{/if}
				<td>
					{#if datasets && row.dataset_id !== null && row.user_email === page.data.userInfo.email}
						<a href={`/v2/projects/${row.project_id}/datasets/${row.dataset_id}`}>
							{row.dataset_dump.name}
						</a>
					{:else}
						{row.dataset_dump.name}
					{/if}
				</td>
				{#if !columnsToHide.includes('user_email')}
					<td>{row.user_email}</td>
				{/if}
			</tr>
		{/each}
	</tbody>
</table>

<JobInfoModal bind:this={jobInfoModal} />
<JobLogsModal bind:this={jobLogsModal} />

<style>
	.jobs-table {
		table-layout: fixed;
	}

	.jobs-table thead {
		word-break: break-word;
	}

	.jobs-table tbody {
		word-break: break-all;
	}
</style>
