<!-- @migration-task Error while migrating Svelte code: This migration would change the name of a slot making the component unusable -->
<script>
	import { env } from '$env/dynamic/public';
	import { page } from '$app/stores';
	import { DataHandler, check } from '@vincjo/datatables';
	import StatusBadge from '$lib/components/jobs/StatusBadge.svelte';
	import JobInfoModal from '$lib/components/v2/jobs/JobInfoModal.svelte';
	import JobLogsModal from '$lib/components/v2/jobs/JobLogsModal.svelte';
	import Th from '$lib/components/common/filterable/Th.svelte';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import { onDestroy, onMount } from 'svelte';
	import { removeDuplicatedItems } from '$lib/common/component_utilities';
	import StandardDismissableAlert from '../../common/StandardDismissableAlert.svelte';
	import TimestampCell from '../../jobs/TimestampCell.svelte';
	import SlimSelect from 'slim-select';

	/** @type {() => Promise<import('fractal-components/types/api').ApplyWorkflowV2[]>} */
	export let jobUpdater;
	/** @type {('project'|'workflow'|'user_email'|'id')[]} */
	export let columnsToHide = [];
	/** @type {boolean} */
	export let admin = false;

	/** @type {JobInfoModal} */
	let jobInfoModal;
	/** @type {JobLogsModal} */
	let jobLogsModal;

	/** @type {import('fractal-components/types/api').ProjectV2[]} */
	let projects = $page.data.projects;
	/** @type {{id: number, name: string}[]} */
	let workflows = $page.data.workflows || [];
	/** @type {import('fractal-components/types/api').ApplyWorkflowV2[]} */
	let jobs = $page.data.jobs || [];
	/** @type {{ id: number, name: string }[]} */
	let datasets = $page.data.datasets || [];

	/** @type {DataHandler} */
	let tableHandler = new DataHandler(jobs);
	tableHandler.sortDesc('id');

	/** @type {import('svelte/store').Readable<import('fractal-components/types/api').ApplyWorkflowV2[]>} */
	let rows = tableHandler.getRows();

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

	// Filters
	$: tableHandler.filter(statusFilter, 'status', check.isEqualTo);
	$: tableHandler.filter(projectFilter, (row) => row.project_dump.id.toString(), check.isEqualTo);
	$: tableHandler.filter(workflowFilter, (row) => row.workflow_dump.id.toString(), check.isEqualTo);
	$: tableHandler.filter(datasetFilter, (row) => row.dataset_dump.id.toString(), check.isEqualTo);

	$: rebuildSlimSelectOptions($rows);

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
		tableHandler.setRows(jobs);
	}

	let cancellingJobs = [];
	let jobCancelledMessage = '';

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
			jobs = await jobUpdater();
			tableHandler.setRows(jobs);
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
		tableHandler.clearFilters();
		statusSelect?.setSelected('');
		projectSelect?.setSelected('');
		workflowSelect?.setSelected('');
		datasetSelect?.setSelected('');
		outputDatasetSelect?.setSelected('');
	}

	onMount(() => {
		updateJobsTimeout = setTimeout(updateJobsInBackground, updateJobsInterval);

		statusSelect = setSlimSelect(
			'status-select',
			[
				{ id: 'submitted', name: 'Submitted' },
				{ id: 'done', name: 'Done' },
				{ id: 'failed', name: 'Failed' }
			],
			(value) => (statusFilter = value),
			false
		);
		projectSelect = setSlimSelect('project-select', projects, (value) => (projectFilter = value));
		workflowSelect = setSlimSelect(
			'workflow-select',
			workflows,
			(value) => (workflowFilter = value)
		);
		datasetSelect = setSlimSelect(
			'input-dataset-select',
			datasets,
			(value) => (datasetFilter = value)
		);
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

{#if tableHandler}
	<div class="d-flex justify-content-end align-items-center mb-3">
		<div>
			{#if !admin}
				<button class="btn btn-warning" on:click={clearFilters}>
					<i class="bi-x-square" />
					Clear filters
				</button>
			{/if}
			<slot name="buttons" />
		</div>
	</div>
	<div id="jobUpdatesError" />
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
				{#if !columnsToHide.includes('id')}
					<Th handler={tableHandler} key="id" label="Id" />
				{/if}
				<Th handler={tableHandler} key="status" label="Status" />
				<th>Options</th>
				<Th handler={tableHandler} key="start_timestamp" label="Start" />
				<Th handler={tableHandler} key="end_timestamp" label="End" />
				{#if !columnsToHide.includes('project')}
					<Th handler={tableHandler} key="project_id" label="Project" />
				{/if}
				{#if !columnsToHide.includes('workflow')}
					<Th handler={tableHandler} key="workflow_id" label="Workflow" />
				{/if}
				<Th handler={tableHandler} key="dataset_id" label="Dataset" />
				{#if !columnsToHide.includes('user_email')}
					<Th handler={tableHandler} key="user_email" label="User" />
				{/if}
			</tr>
			{#if !admin}
				<tr>
					{#if !columnsToHide.includes('id')}
						<th />
					{/if}
					<th>
						<select id="status-select" class="invisible" />
					</th>
					<th />
					<th />
					<th />
					{#if !columnsToHide.includes('project')}
						<th>
							{#if projects}
								<select id="project-select" class="invisible" />
							{/if}
						</th>
					{/if}
					{#if !columnsToHide.includes('workflow')}
						<th>
							{#if workflows}
								<select id="workflow-select" class="invisible" />
							{/if}
						</th>
					{/if}
					<th>
						<select id="dataset-select" class="invisible" />
					</th>
					{#if !columnsToHide.includes('user_email')}
						<th />
					{/if}
				</tr>
			{/if}
		</thead>

		<tbody>
			{#if rows}
				{#each $rows as row}
					<tr class="align-middle">
						{#if !columnsToHide.includes('id')}
							<td> {row.id} </td>
						{/if}
						<td>
							<span>
								<StatusBadge status={row.status} />
								{#if admin}
									<slot name="edit-status" {row} />
								{/if}
							</span>
						</td>
						<td>
							<button class="btn btn-info" on:click|preventDefault={() => jobInfoModal.show(row)}>
								<i class="bi-info-circle" />
								Info
							</button>
							<button
								class="btn btn-light"
								on:click|preventDefault={() => jobLogsModal.show(row, admin)}
							>
								<i class="bi-list-columns-reverse" />
								Logs
							</button>
							{#if (admin && row.id) || (row.project_id !== null && row.user_email === $page.data.userInfo.email)}
								<a class="btn btn-light" href={getDownloadUrl(row)} download={`${row.id}_logs.zip`}>
									<i class="bi-arrow-down-circle" />
								</a>
							{/if}
							{#if row.status === 'submitted'}
								<button
									class="btn btn-danger"
									on:click={() => handleJobCancel(row)}
									disabled={cancellingJobs.includes(row.id)}
								>
									{#if cancellingJobs.includes(row.id)}
										<span
											class="spinner-border spinner-border-sm"
											role="status"
											aria-hidden="true"
										/>
									{:else}
										<i class="bi-x-circle" />
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
								{#if projects && row.project_id !== null && row.user_email === $page.data.userInfo.email}
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
								{#if workflows && row.workflow_id !== null && row.user_email === $page.data.userInfo.email}
									<a href={`/v2/projects/${row.project_id}/workflows/${row.workflow_id}`}>
										{row.workflow_dump.name}
									</a>
								{:else}
									{row.workflow_dump.name}
								{/if}
							</td>
						{/if}
						<td>
							{#if datasets && row.dataset_id !== null && row.user_email === $page.data.userInfo.email}
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
			{/if}
		</tbody>
	</table>
{/if}

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
