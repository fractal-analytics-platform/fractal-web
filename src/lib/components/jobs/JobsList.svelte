<script>
	import { env } from '$env/dynamic/public';
	import { page } from '$app/stores';
	import { DataHandler, check } from '@vincjo/datatables';
	import StatusBadge from '$lib/components/jobs/StatusBadge.svelte';
	import JobInfoModal from '$lib/components/jobs/JobInfoModal.svelte';
	import JobLogsModal from '$lib/components/jobs/JobLogsModal.svelte';
	import Th from '$lib/components/common/filterable/Th.svelte';
	import { displayStandardErrorAlert } from '$lib/common/errors';
	import { onDestroy, onMount } from 'svelte';
	import { removeDuplicatedItems } from '$lib/common/component_utilities';
	import StandardDismissableAlert from '../common/StandardDismissableAlert.svelte';

	/** @type {() => Promise<import('$lib/types').ApplyWorkflow[]>} */
	export let jobUpdater;
	/** @type {('project'|'workflow'|'user_email')[]} */
	export let columnsToHide = [];
	/** @type {boolean} */
	export let admin = false;

	/** @type {JobInfoModal} */
	let jobInfoModal;
	/** @type {JobLogsModal} */
	let jobLogsModal;

	/** @type {import('$lib/types').Project[]} */
	let projects = $page.data.projects;
	/** @type {{id: number, name: string}[]} */
	let workflows = $page.data.workflows || [];
	/** @type {import('$lib/types').ApplyWorkflow[]} */
	let jobs = $page.data.jobs || [];
	/** @type {{ id: number, name: string }[]} */
	let inputDatasets = $page.data.inputDatasets || [];
	/** @type {{ id: number, name: string }[]} */
	let outputDatasets = $page.data.outputDatasets || [];
	/** @type {{ id: number, name: string }[]} */
	let datasets = inputDatasets.concat(outputDatasets);

	/** @type {DataHandler} */
	let tableHandler = new DataHandler(jobs);
	tableHandler.sortDesc('id');

	/** @type {import('svelte/types/runtime/store').Readable<import('$lib/types').ApplyWorkflow[]>} */
	let rows = tableHandler.getRows();

	// Filters
	let projectFilter = '';
	let workflowFilter = '';
	let inputDatasetFilter = '';
	let outputDatasetFilter = '';
	let statusFilter = '';

	// Filters
	$: tableHandler.filter(projectFilter, 'project_id', check.isEqualTo);
	$: tableHandler.filter(workflowFilter, 'workflow_id', check.isEqualTo);
	$: tableHandler.filter(inputDatasetFilter, 'input_dataset_id', check.isEqualTo);
	$: tableHandler.filter(outputDatasetFilter, 'output_dataset_id', check.isEqualTo);
	$: tableHandler.filter(statusFilter, 'status');

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	/**
	 * @param {import('$lib/types').ApplyWorkflow[]} newJobs
	 */
	export function setJobs(newJobs) {
		jobs = newJobs;
		workflows = removeDuplicatedItems(
			/** @type {{id: number, name: string}[]} */ (
				jobs.filter((j) => j.workflow_dump).map((j) => j.workflow_dump)
			)
		);
		inputDatasets = removeDuplicatedItems(
			/** @type {{id: number, name: string}[]} */
			(jobs.filter((j) => j.input_dataset_dump).map((j) => j.input_dataset_dump))
		);
		outputDatasets = removeDuplicatedItems(
			/** @type {{id: number, name: string}[]} */
			(jobs.filter((j) => j.output_dataset_dump).map((j) => j.output_dataset_dump))
		);
		datasets = inputDatasets.concat(outputDatasets);
		tableHandler.setRows(jobs);
	}

	let cancellingJobs = [];
	let jobCancelledMessage = '';

	/**
	 * Requests the server to stop a job execution
	 * @param {import('$lib/types').ApplyWorkflow} job
	 * @returns {Promise<void>}
	 */
	async function handleJobCancel(job) {
		if (errorAlert) {
			errorAlert.hide();
		}

		console.log('Stop running job');

		cancellingJobs = [...cancellingJobs, job.id];
		jobCancelledMessage = '';

		let stopJobUrl = admin
			? `/api/admin/job/${job.id}/stop`
			: `/api/v1/project/${job.project_id}/job/${job.id}/stop`;
		const response = await fetch(stopJobUrl, {
			method: 'GET',
			credentials: 'include'
		});

		cancellingJobs = cancellingJobs.filter((j) => j !== job.id);

		if (response.ok) {
			jobCancelledMessage = 'Job cancellation request received. The job will stop in a few seconds';
		} else {
			console.error('Error stopping job');
			const errorResponse = await response.json();
			errorAlert = displayStandardErrorAlert(errorResponse, 'jobUpdatesError');
		}
	}

	/**
	 * @param projectId {number}
	 */
	function getProjectName(projectId) {
		const filteredProjects = projects.filter((p) => p.id === projectId);
		if (filteredProjects.length === 1) {
			return filteredProjects[0].name;
		}
		return '';
	}

	const updateJobsInterval = env.PUBLIC_UPDATE_JOBS_INTERVAL
		? parseInt(env.PUBLIC_UPDATE_JOBS_INTERVAL)
		: 3000;
	let updateJobsTimeout = undefined;

	async function updateJobsInBackground() {
		const jobsToCheck = jobs.filter((j) => j.status === 'running' || j.status === 'submitted');
		if (jobsToCheck.length > 0) {
			jobs = await jobUpdater();
			tableHandler.setRows(jobs);
		}
		clearTimeout(updateJobsTimeout);
		updateJobsTimeout = setTimeout(updateJobsInBackground, updateJobsInterval);
	}

	/**
	 * @param {import('$lib/types').ApplyWorkflow} row
	 */
	function getDownloadUrl(row) {
		if (admin) {
			return `/api/admin/job/${row.id}/download`;
		} else {
			return `/api/v1/project/${row.project_id}/job/${row.id}/download`;
		}
	}

	onMount(() => {
		updateJobsTimeout = setTimeout(updateJobsInBackground, updateJobsInterval);
	});

	onDestroy(() => {
		clearTimeout(updateJobsTimeout);
	});
</script>

<StandardDismissableAlert message={jobCancelledMessage} />

{#if tableHandler}
	<div class="d-flex justify-content-end align-items-center my-3">
		<div>
			{#if !admin}
				<button
					class="btn btn-warning"
					on:click={() => {
						tableHandler.clearFilters();
						workflowFilter = '';
						inputDatasetFilter = '';
						outputDatasetFilter = '';
						statusFilter = '';
					}}
				>
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
			<col width="120" />
			{#if !columnsToHide.includes('user_email')}
				<col width="120" />
			{/if}
		</colgroup>
		<thead class="table-light">
			<tr>
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
				<Th handler={tableHandler} key="input_dataset_id" label="Input dataset" />
				<Th handler={tableHandler} key="output_dataset_id" label="Output dataset" />
				{#if !columnsToHide.includes('user_email')}
					<Th handler={tableHandler} key="user_email" label="User" />
				{/if}
			</tr>
			{#if !admin}
				<tr>
					<th>
						<select class="form-control" bind:value={statusFilter}>
							<option value="">All</option>
							<option value="running">Running</option>
							<option value="done">Done</option>
							<option value="failed">Failed</option>
							<option value="submitted">Submitted</option>
						</select>
					</th>
					<th />
					<th />
					<th />
					{#if !columnsToHide.includes('project')}
						<th>
							{#if projects}
								<select class="form-control" bind:value={projectFilter}>
									<option value="">All</option>
									{#each projects as project}
										<option value={project.id}>{project.name}</option>
									{/each}
								</select>
							{/if}
						</th>
					{/if}
					{#if !columnsToHide.includes('workflow')}
						<th>
							{#if workflows}
								<select class="form-control" bind:value={workflowFilter}>
									<option value="">All</option>
									{#each workflows as workflow}
										<option value={workflow.id}>{workflow.name}</option>
									{/each}
								</select>
							{/if}
						</th>
					{/if}
					<th>
						{#key inputDatasetFilter}
							<select class="form-control" bind:value={inputDatasetFilter}>
								<option value="">All</option>
								{#each inputDatasets as dataset}
									<option value={dataset.id}>{dataset.name}</option>
								{/each}
							</select>
						{/key}
					</th>
					<th>
						<select class="form-control" bind:value={outputDatasetFilter}>
							<option value="">All</option>
							{#each outputDatasets as dataset}
								<option value={dataset.id}>{dataset.name}</option>
							{/each}
						</select>
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
						<td>
							<span>
								<StatusBadge status={row.status} />
								{#if admin}
									<slot name="edit-status" {row} />
								{/if}
							</span>
						</td>
						<td>
							<button
								class="btn btn-info"
								on:click|preventDefault={() =>
									jobInfoModal.show(row, getProjectName(row.project_id))}
							>
								<i class="bi-info-circle" />
								Info
							</button>
							{#if row.status === 'failed' || row.status === 'done'}
								<button
									class="btn btn-light"
									on:click|preventDefault={() => jobLogsModal.show(row.project_id, row.id, row.log)}
								>
									<i class="bi-list-columns-reverse" />
									Logs
								</button>
								{#if (admin && row.id) || (row.project_id !== null && row.user_email === $page.data.userInfo.email)}
									<a
										class="btn btn-light"
										href={getDownloadUrl(row)}
										download={`${row.id}_logs.zip`}
									>
										<i class="bi-arrow-down-circle" />
									</a>
								{/if}
							{/if}
							{#if row.status === 'running'}
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
							{row.start_timestamp ? new Date(row.start_timestamp).toLocaleString() : '-'}
						</td>
						<td>
							{row.end_timestamp ? new Date(row.end_timestamp).toLocaleString() : '-'}
						</td>
						{#if !columnsToHide.includes('project')}
							<td>
								{#if projects && row.project_id !== null && row.user_email === $page.data.userInfo.email}
									<a href={`/projects/${row.project_id}`}>
										{projects.find((project) => project.id === row.project_id)?.name}
									</a>
								{:else}
									{projects.find((project) => project.id === row.project_id)?.name || '-'}
								{/if}
							</td>
						{/if}
						{#if !columnsToHide.includes('workflow')}
							<td>
								{#if workflows && row.workflow_id !== null && row.user_email === $page.data.userInfo.email}
									<a href={`/projects/${row.project_id}/workflows/${row.workflow_id}`}>
										{row.workflow_dump?.name}
									</a>
								{:else}
									{row.workflow_dump?.name || '-'}
								{/if}
							</td>
						{/if}
						<td>
							{#if inputDatasets && row.input_dataset_id !== null && row.user_email === $page.data.userInfo.email}
								<a href={`/projects/${row.project_id}/datasets/${row.input_dataset_id}`}>
									{row.input_dataset_dump?.name}
								</a>
							{:else}
								{row.input_dataset_dump?.name || '-'}
							{/if}
						</td>
						<td>
							{#if outputDatasets && row.output_dataset_id !== null && row.user_email === $page.data.userInfo.email}
								<a href={`/projects/${row.project_id}/datasets/${row.output_dataset_id}`}>
									{row.output_dataset_dump?.name}
								</a>
							{:else}
								{row.output_dataset_dump?.name || '-'}
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

<JobInfoModal {workflows} {datasets} bind:this={jobInfoModal} />
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
